import type {
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenWaitResult,
} from "discord-api-types/rest";
import { MessageFlags } from "discord-api-types/v10";
import { createFetchClient } from "../lib/api";

const WEBHOOK_ID = Bun.env.WEBHOOK_ID;
const WEBHOOK_TOKEN = Bun.env.WEBHOOK_TOKEN;
const BASE_URL = "https://discord.com/api";

const client = createFetchClient(BASE_URL);

async function sendMessage(body: RESTPostAPIWebhookWithTokenJSONBody) {
  let pathname = `/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}`;
  // Wait for the message to be sent
  const searchParams = new URLSearchParams();
  searchParams.set("wait", "true");

  if (body.components?.length) {
    searchParams.set("with_components", "true");
    body.flags = MessageFlags.IsComponentsV2;
  }
  pathname += `?${searchParams.toString()}`;

  const response = await client.post<RESTPostAPIWebhookWithTokenWaitResult>(
    pathname,
    body,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response;
}

export default { sendMessage };
