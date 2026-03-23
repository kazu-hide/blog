import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useThreads } from '../hooks/useThreads';

const ThreadList = () => {
  const threads = useThreads();

  return (
    <Container sx={{ py: 6 }} maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4">Threads</Typography>
        <Typography color="text.secondary">
          日々のチャレンジや学びをスレッド単位でまとめています。気になる
          トピックを覗いてみてください。
        </Typography>
        <Stack spacing={2}>
          {threads.map((thread) => (
            <Card key={thread.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/thread/${thread.id}`}>
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h5">{thread.title}</Typography>
                    <Chip
                      label={`${thread.posts.length} posts`}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                  <Typography color="text.secondary">
                    {thread.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
};

export default ThreadList;

