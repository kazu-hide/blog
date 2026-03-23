import {
  AppBar,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import ThreadList from "./components/ThreadList";
import ThreadDetail from "./components/ThreadDetail";
import PostContent from "./components/PostContent";
import PostList from "./components/PostList";

const App = () => {
  return (
    <Stack minHeight="100vh">
      <AppBar color="inherit" elevation={0} position="static">
        <Toolbar sx={{ maxWidth: 960, width: "100%", mx: "auto" }}>
          <MenuBookRoundedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My Blog
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mr: 1 }}>
            <Button component={RouterLink} to="/posts" color="primary">
              Posts
            </Button>
            <Button component={RouterLink} to="/threads" color="primary">
              Threads
            </Button>
          </Stack>
          <IconButton
            edge="end"
            color="primary"
            aria-label="GitHub"
            href="https://github.com/ZawaPaP"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/threads" element={<ThreadList />} />
          <Route path="/thread/:threadId" element={<ThreadDetail />} />
          <Route path="/thread/:threadId/:postId" element={<PostContent />} />
          <Route path="*" element={<PostList />} />
        </Routes>
      </Container>
      <Stack
        component="footer"
        alignItems="center"
        sx={{ py: 3 }}
        color="text.secondary"
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} My Blog
        </Typography>
      </Stack>
    </Stack>
  );
};

export default App;
