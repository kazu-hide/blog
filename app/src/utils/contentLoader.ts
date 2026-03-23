import type { Post, Thread } from "../types";

const modules = import.meta.glob("../../../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type FrontMatter = Record<string, string>;

type ThreadAggregate = Thread & { hasManualDescription: boolean };

const defaultThreadDescription = "チャレンジや学習ログをまとめたスレッドです。";

const cached = {
  threads: null as Thread[] | null,
  posts: null as Post[] | null,
};

const trimQuotes = (value: string) => {
  const trimmed = value.trim();
  return trimmed.replace(/^['"`]/, "").replace(/['"`]$/, "");
};

const formatThreadTitle = (slug: string, fallback?: string) => {
  if (fallback) return fallback;
  return slug
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const parseFrontMatter = (raw: string): { meta: FrontMatter; body: string } => {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  if (!fmMatch) {
    return { meta: {}, body: raw.trim() };
  }

  const meta: FrontMatter = {};
  fmMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key || !rest.length) return;
      meta[key.trim()] = trimQuotes(rest.join(":"));
    });

  const body = raw.slice(fmMatch[0].length).trim();
  return { meta, body };
};

const buildExcerpt = (body: string, override?: string) => {
  if (override) return override;
  const text = body
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/[#>*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 140) + (text.length > 140 ? "…" : "");
};

const loadPosts = (): Post[] => {
  if (cached.posts) return cached.posts;

  const posts: Post[] = Object.entries(modules).map(([path, raw]) => {
    const relative = path.replace(/^.*\/content\//, "");
    const segments = relative.split("/");
    const threadId = segments.shift() ?? "general";
    const slug = segments.join("/").replace(/\.md$/, "");
    const { meta, body } = parseFrontMatter(raw);

    return {
      id: slug,
      threadId,
      title: meta.title ?? slug,
      date: meta.date ?? new Date().toISOString(),
      excerpt: buildExcerpt(body, meta.excerpt),
      content: body,
      threadTitle: meta.threadTitle,
      threadDescription: meta.threadDescription,
    };
  });

  cached.posts = posts.sort((a, b) => b.date.localeCompare(a.date));
  return cached.posts;
};

const loadThreads = (): Thread[] => {
  if (cached.threads) return cached.threads;

  const posts = loadPosts();
  const threadMap = new Map<string, ThreadAggregate>();

  posts.forEach((post) => {
    const thread = threadMap.get(post.threadId);
    if (!thread) {
      threadMap.set(post.threadId, {
        id: post.threadId,
        title: formatThreadTitle(post.threadId, post.threadTitle),
        description:
          post.threadDescription ?? post.excerpt ?? defaultThreadDescription,
        posts: [post],
        lastUpdated: post.date,
        hasManualDescription: Boolean(post.threadDescription),
      });
      return;
    }

    thread.posts.push(post);
    if (post.date.localeCompare(thread.lastUpdated) > 0) {
      thread.lastUpdated = post.date;
    }
    if (post.threadTitle && thread.title === formatThreadTitle(post.threadId)) {
      thread.title = post.threadTitle;
    }
    if (post.threadDescription) {
      thread.description = post.threadDescription;
      thread.hasManualDescription = true;
    } else if (!thread.hasManualDescription) {
      thread.description = post.excerpt ?? thread.description;
    }
  });

  const threads = Array.from(threadMap.values()).map(
    ({ hasManualDescription: _discard, ...thread }) => ({
      ...thread,
      posts: [...thread.posts].sort((a, b) => b.date.localeCompare(a.date)),
    })
  );

  cached.threads = threads.sort((a, b) =>
    b.lastUpdated.localeCompare(a.lastUpdated)
  );
  return cached.threads;
};

export const getThreads = () => loadThreads();

export const getPosts = () => loadPosts();

export const getThread = (threadId: string) =>
  loadThreads().find((thread) => thread.id === threadId);

export const getPost = (threadId: string, postId: string) =>
  loadPosts().find((post) => post.threadId === threadId && post.id === postId);
