export type Post = {
  id: string;
  threadId: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  threadTitle?: string;
  threadDescription?: string;
};

export type Thread = {
  id: string;
  title: string;
  description: string;
  posts: Post[];
  lastUpdated: string;
};

