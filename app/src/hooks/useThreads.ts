import { useMemo } from 'react';
import { getPost, getPosts, getThread, getThreads } from '../utils/contentLoader';
import type { Post, Thread } from '../types';

export const useThreads = (): Thread[] =>
  useMemo(() => getThreads(), []);

export const usePosts = (): Post[] => useMemo(() => getPosts(), []);

export const useThread = (threadId?: string): Thread | undefined =>
  useMemo(() => {
    if (!threadId) return undefined;
    return getThread(threadId);
  }, [threadId]);

export const usePost = (
  threadId?: string,
  postId?: string
): Post | undefined =>
  useMemo(() => {
    if (!threadId || !postId) return undefined;
    return getPost(threadId, postId);
  }, [threadId, postId]);

