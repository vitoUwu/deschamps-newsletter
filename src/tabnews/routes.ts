import { createFetchClient } from "../lib/api";

interface Content {
  id: string;
  owner_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  status: "published";
  type: "content";
  source_url: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  deleted_at: string | null;
  owner_username: string;
  tabcoins: number;
  tabcoins_credit: number;
  tabcoins_debit: number;
  children_deep_count: number;
}

interface ContentDetails {
  id: string;
  owner_id: string;
  parent_id: string | null;
  slug: string;
  title: string;
  body: string;
  status: "published";
  type: "content";
  source_url: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  deleted_at: string | null;
  owner_username: string;
  tabcoins: number;
  tabcoins_credit: number;
  tabcoins_debit: number;
  children_deep_count: number;
}

interface GetContentOptions {
  username: string;
  /**
   * @default "relevant"
   */
  strategy?: "new" | "old" | "relevant";
  /**
   * @default 10
   */
  perPage?: number;
  /**
   * @default 1
   */
  page?: number;
}

const client = createFetchClient("https://www.tabnews.com.br/api/v1");

/**
 * Get user contents from Tabnews.
 * @param options - The options for the request.
 * @returns The contents of the user.
 */
export async function getUserContents(options: GetContentOptions) {
  const { username, strategy = "relevant", perPage = 10, page = 1 } = options;

  const params = new URLSearchParams();
  params.set("strategy", strategy);
  params.set("per_page", perPage.toString());
  params.set("page", page.toString());

  const response = await client.get<Content[]>(`/contents/${username}`, params);

  return response;
}

/**
 * Get content details from Tabnews.
 * @param username - The username of the user.
 * @param slug - The slug of the content.
 * @returns The details of the content.
 */
export async function getUserContent(username: string, slug: string) {
  const response = await client.get<ContentDetails>(
    `/contents/${username}/${slug}`
  );
  return response;
}
