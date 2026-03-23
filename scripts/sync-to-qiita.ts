import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "content", "tech");
const QIITA_DIR = join(__dirname, "..", "qiita", "public");

type BlogFrontMatter = {
  title: string;
  date: string;
  excerpt?: string;
  threadTitle?: string;
  threadDescription?: string;
  qiita?: {
    tags: string[];
    emoji: string;
  };
};

const parseFrontMatter = (raw: string): { meta: Record<string, string>; body: string } => {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  if (!match) return { meta: {}, body: raw.trim() };

  const meta: Record<string, string> = {};
  let currentKey = "";

  match[1].split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("- ") && currentKey) {
      const prev = meta[currentKey] ?? "";
      const value = trimmed.slice(2).replace(/^['"`]|['"`]$/g, "");
      meta[currentKey] = prev ? `${prev},${value}` : value;
      return;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) return;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim().replace(/^['"`]|['"`]$/g, "");
    currentKey = key;
    meta[key] = value;
  });

  const body = raw.slice(match[0].length).trim();
  return { meta, body };
};

const toQiitaFrontMatter = (meta: Record<string, string>): string => {
  const title = meta.title ?? "Untitled";
  const tags = meta["qiita.tags"]
    ? meta["qiita.tags"].split(",").map((t) => t.trim())
    : [];
  const emoji = meta["qiita.emoji"] ?? "📝";

  const tagLines = tags.map((tag) => `  - ${tag}`).join("\n");

  return [
    "---",
    `title: ${title}`,
    `tags:`,
    tagLines || "  - プログラミング",
    `private: false`,
    `updated_at: ''`,
    `id: null`,
    `organization_url_name: null`,
    `slide: false`,
    `ignorePublish: false`,
    "---",
  ].join("\n");
};

const syncArticles = () => {
  if (!existsSync(CONTENT_DIR)) {
    console.log("No tech articles found.");
    return;
  }

  if (!existsSync(QIITA_DIR)) {
    mkdirSync(QIITA_DIR, { recursive: true });
  }

  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  let synced = 0;

  for (const file of files) {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf-8");
    const { meta, body } = parseFrontMatter(raw);

    if (!meta["qiita.tags"] && !meta["qiita.emoji"]) {
      console.log(`  skip: ${file} (no qiita metadata)`);
      continue;
    }

    const qiitaContent = `${toQiitaFrontMatter(meta)}\n\n${body}\n`;
    const outPath = join(QIITA_DIR, file);

    writeFileSync(outPath, qiitaContent, "utf-8");
    console.log(`  sync: ${file}`);
    synced++;
  }

  console.log(`\nSynced ${synced} article(s) to qiita/public/`);
};

syncArticles();
