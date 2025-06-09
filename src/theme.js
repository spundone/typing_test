export const defaultTheme = {
  light: {
    background: '#ffffff',
    text: '#000000',
    accent: '#0099ff',
    correct: '#00ff00',
    incorrect: '#ff0000',
    input: '#f0f0f0',
    button: '#e0e0e0'
  },
  dark: {
    background: '#1e1e1e',
    text: '#ffffff',
    accent: '#0099ff',
    correct: '#00ff00',
    incorrect: '#ff0000',
    input: '#2d2d2d',
    button: '#3d3d3d'
  }
};

export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}; 