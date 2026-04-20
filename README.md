# Marmotconn

A Windows desktop Git GUI client for Gitea. Minimal, modern, and multilingual.

![Marmotconn](assets/logo.png)

## Features

- **Changes** — View staged/unstaged files, stage/unstage individually or in bulk, diff viewer
- **History** — Commit history with per-commit change details
- **Branches** — Create, switch, delete branches, view remote branches
- **Stash** — Save, apply, and restore stashes; file-level restore
- **Gitea integration** — Connect to server, list repositories, clone
- **SSH support** — SSH key generation and management
- **Push / Pull** — Authentication handled automatically (using saved server credentials)
- **Multilingual** — English, Turkish, German, French, Spanish, Portuguese, Russian, Chinese, Japanese

## Requirements

- Windows 10/11 (x64)
- [Git](https://git-scm.com/download/win) must be installed

## Installation

Download and run suitable version from the releases page.

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run start

# Build
npm run build

# Create installer
npm run dist
```

## Technologies

- [Electron](https://www.electronjs.org/) — Desktop application framework
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — UI
- [Vite](https://vitejs.dev/) — Renderer build tool
- [simple-git](https://github.com/steveukzz/simple-git) — Git operations
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [i18next](https://www.i18next.com/) — Internationalization

## License

MIT
