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

const getUserContents = withRetry(tabnews.routes.getUserContents, {
  retries: 3,
  delay: 1000,
  approach: "exponential",
});

logger.info("Starting content searcher job...");

const tracer = trace.getTracer("jobs");

// Every 5 minutes, search for a content
const cron = new Cron("*/5 * * * *", async () => {
  return tracer.startActiveSpan("get-content-and-publish", async (span) => {
    try {
      console.log("Searching for content...");

      span.setAttribute("newsletter.username", NEWSLETTER_USERNAME);
      span.setAttribute("newsletter.strategy", "new");
      span.setAttribute("newsletter.perPage", 1);

      const contents = await getUserContents({
        username: NEWSLETTER_USERNAME,
        strategy: "new",
        perPage: 1,
      });

      // Should I add the contents to the span?
      span.setAttribute("newsletter.contents", JSON.stringify(contents));

      // This filter is used to avoid the app to publish a content that is a comment of another content.
      // As the strategy is "new", the first content is the most recent one.
      const content = contents.find((content) => !content.parent_id);

      if (!content) {
        return;
      }

      const exists = await db.contentExists(content.id);
      span.setAttribute("newsletter.exists", exists);
      if (exists) {
        return;
      }

      const details = await tabnews.routes.getUserContent(
        NEWSLETTER_USERNAME,
        content.slug
      );
      span.setAttribute("newsletter.details", JSON.stringify(details));

      const chunks = StringUtils.sliced(details.body, 3600);
      span.setAttribute("newsletter.chunks_count", chunks.length);

      await discord.webhook.sendMessage({
        components: chunks.map((chunk, index) =>
          discord.components.createNewsletterComponent({
            body: chunk,
            slug: content.slug,
            username: NEWSLETTER_USERNAME,
            includeGoToTabnewsButton: index === chunks.length - 1,
            includeThumbnail: index === 0,
          })
        ),
      });

      await db.addSentContent(content.id);
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
