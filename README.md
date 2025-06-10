# Hyperwebster: Inf-Typer

A modern, terminal-themed typing test application built with React. Test your typing speed and accuracy with various text samples from Shakespeare, One Piece, and Aesop's fables.

## Features

- Terminal-inspired UI with light/dark theme support
- Multiple text categories (Shakespeare, One Piece, Aesop's fables)
- Different time modes (30s, 60s, 90s, and complete text)
- Real-time WPM and accuracy tracking
- Custom text input option
- Leaderboard with persistent storage
- Mobile-responsive design
- Fun easter eggs in the terminal controls

## Live Demo

[Add your deployed site URL here]

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/spundone/hyperwebster-typer.git
cd hyperwebster-typer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Deployment

This project can be easily deployed to various platforms:

### GitHub Pages

1. Add `homepage` field to `package.json`:
```json
{
  "homepage": "https://spundone.github.io/hyperwebster-typer"
}
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Add deployment scripts to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

4. Deploy:
```bash
npm run deploy
```

### Netlify

1. Create a `netlify.toml` file in the root directory:
```toml
[build]
  command = "npm run build"
  publish = "build"
```

2. Connect your repository to Netlify and deploy.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React team for the amazing framework
- One Piece for the inspiring quotes
- Shakespeare for the timeless words
- Aesop for the classic fables
