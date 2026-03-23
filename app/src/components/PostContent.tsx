import {
  Alert,
  Breadcrumbs,
  Container,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { usePost, useThread } from '../hooks/useThreads';

const renderMarkdown = (content: string) => {
  let html = content;
  html = html.replace(
    /```([\s\S]*?)```/g,
    (_, code) => `<pre><code>${code.trim()}</code></pre>`
  );
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html}</p>`;
  return html;
};

const PostContent = () => {
  const { threadId, postId } = useParams();
  const post = usePost(threadId, postId);
  const thread = useThread(threadId);

  const markup = useMemo(() => {
    if (!post) return '';
    return renderMarkdown(post.content);
  }, [post]);

  if (!post || !thread) {
    return (
      <Container sx={{ py: 6 }} maxWidth="md">
        <Alert severity="warning">投稿が見つかりませんでした。</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 6 }} maxWidth="md">
      <Stack spacing={3}>
        <Breadcrumbs>
          <Link component={RouterLink} to="/">
            Threads
          </Link>
          <Link component={RouterLink} to={`/thread/${thread.id}`}>
            {thread.title}
          </Link>
          <Typography color="text.primary">{post.title}</Typography>
        </Breadcrumbs>
        <Stack spacing={1}>
          <Typography variant="h4">{post.title}</Typography>
          <Typography color="text.secondary">
            {new Date(post.date).toLocaleString('ja-JP', {
              dateStyle: 'medium'
            })}
          </Typography>
        </Stack>
        <article
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.8
          }}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </Stack>
    </Container>
  );
};

export default PostContent;

