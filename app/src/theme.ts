import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1d4ed8'
    },
    secondary: {
      main: '#059669'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: ['"Inter"', '"Noto Sans JP"', 'sans-serif'].join(','),
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    body1: { lineHeight: 1.7 }
  },
  shape: {
    borderRadius: 12
  }
});

export default theme;

