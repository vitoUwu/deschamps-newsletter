import { Database } from "bun:sqlite";

const db = new Database("./db/newsletter.sqlite", { create: true });

db.run("CREATE TABLE IF NOT EXISTS contents (id TEXT PRIMARY KEY)");

async function contentExists(id: string) {
  const result = await db.query("SELECT id FROM contents WHERE id = ?").get(id);

  return result !== null;
}

async function addSentContent(id: string) {
  const run = db.query("INSERT INTO contents (id) VALUES (?)").run(id);

  return run.changes > 0;
}

process.on("SIGINT", () => {
  db.close(false);
});

export default { contentExists, addSentContent };
