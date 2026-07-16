import { trace } from "@opentelemetry/api";
import type { AnyValue } from "@opentelemetry/api-logs";
import { Cron } from "croner";
import db from "../db/db";
import discord from "./discord";
import { withRetry } from "./lib/with-retry";
import logger from "./observability/logger";
import tabnews from "./tabnews";
import StringUtils from "./utils/string";

const NEWSLETTER_USERNAME = "NewsletterOficial";

const retryOptions = {
  retries: 3,
  delay: 1000,
  approach: "exponential",
} as const;

const getUserContents = withRetry(tabnews.routes.getUserContents, retryOptions);
const getUserContent = withRetry(tabnews.routes.getUserContent, retryOptions);
const sendMessage = withRetry(discord.webhook.sendMessage, retryOptions);

logger.info("Starting content searcher job...");

const tracer = trace.getTracer("jobs");

// Every 5 minutes, search for a content
const cron = new Cron("*/5 * * * *", async () => {
  return tracer.startActiveSpan("get-content-and-publish", async (span) => {
    try {
      console.log("Searching for content...");

      span.setAttribute("newsletter.username", NEWSLETTER_USERNAME);
      span.setAttribute("newsletter.strategy", "new");
      span.setAttribute("newsletter.perPage", 10);

      const contents = await getUserContents({
        username: NEWSLETTER_USERNAME,
        strategy: "new",
        perPage: 10,
      });

      // Should I add the contents to the span?
      span.setAttribute("newsletter.contents", JSON.stringify(contents));

      // Filter out comments (they have a parent_id) so we only publish posts.
      // The API returns contents newest-first, so we reverse to publish oldest-first.
      const posts = contents.filter((content) => !content.parent_id);

      const unsentPosts = [];
      for (const post of posts) {
        const exists = await db.contentExists(post.id);
        if (!exists) {
          unsentPosts.push(post);
        }
      }
      unsentPosts.reverse();

      span.setAttribute("newsletter.unsent_count", unsentPosts.length);

      for (const content of unsentPosts) {
        const details = await getUserContent(NEWSLETTER_USERNAME, content.slug);
        span.setAttribute("newsletter.details", JSON.stringify(details));

        const chunks = StringUtils.sliced(details.body, 3600);
        span.setAttribute("newsletter.chunks_count", chunks.length);

        // Each chunk must be sent as its own message, since Components V2
        // caps total text at 4000 chars. Send sequentially to preserve order.
        for (let index = 0; index < chunks.length; index++) {
          await sendMessage({
            components: [
              discord.components.createNewsletterComponent({
                body: chunks[index]!,
                slug: content.slug,
                username: NEWSLETTER_USERNAME,
                includeGoToTabnewsButton: index === chunks.length - 1,
                includeThumbnail: index === 0,
              }),
            ],
          });
        }

        await db.addSentContent(content.id);
      }
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
      } else {
        span.recordException(new Error("Unknown error"));
      }
      logger.error(error as AnyValue);
    } finally {
      span.end();
    }
  });
});

logger.info(
  `Job started, every 5 minutes, searching for content...\nNext run in ${cron.msToNext()} ms`
);
