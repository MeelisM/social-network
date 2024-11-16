import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',  // Light blue for contrast on dark backgrounds
    },
    background: {
      default: '#121212', // Dark background for the main app
      paper: '#1e1e1e',   // Slightly lighter for Paper elements
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
});

export default theme;
