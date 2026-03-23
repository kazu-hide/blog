import {
  Alert,
  Breadcrumbs,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useThread } from '../hooks/useThreads';

const ThreadDetail = () => {
  const { threadId } = useParams();
  const thread = useThread(threadId);

  if (!thread) {
    return (
      <Container sx={{ py: 6 }} maxWidth="md">
        <Alert severity="warning">スレッドが見つかりませんでした。</Alert>
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
          <Typography color="text.primary">{thread.title}</Typography>
        </Breadcrumbs>
        <Stack spacing={1}>
          <Typography variant="h4">{thread.title}</Typography>
          <Typography color="text.secondary">{thread.description}</Typography>
        </Stack>
        <Stack spacing={2}>
          {thread.posts.map((post) => (
            <Card key={post.id} variant="outlined">
              <CardActionArea
                component={RouterLink}
                to={`/thread/${thread.id}/${post.id}`}
              >
                <CardContent>
                  <Typography variant="h6">{post.title}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 1 }}
                  >
                    {new Date(post.date).toLocaleDateString('ja-JP')}
                  </Typography>
                  <Typography color="text.secondary">{post.excerpt}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
};

export default ThreadDetail;

