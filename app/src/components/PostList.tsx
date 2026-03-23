import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { usePosts } from "../hooks/useThreads";

const PostList = () => {
  const posts = usePosts();

  return (
    <Container sx={{ py: 6 }} maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h4">Latest Posts</Typography>
        <Typography color="text.secondary">
          すべての投稿を日付順に並べています。
        </Typography>
        <Stack spacing={2}>
          {posts.map((post) => (
            <Card key={`${post.threadId}-${post.id}`} variant="outlined">
              <CardActionArea
                component={RouterLink}
                to={`/thread/${post.threadId}/${post.id}`}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h6">{post.title}</Typography>
                    <Chip
                      label={post.threadTitle ?? post.threadId}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {new Date(post.date).toLocaleString("ja-JP", {
                      dateStyle: "medium",
                    })}
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

export default PostList;
