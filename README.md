# Dash Platform Feed App

A beautiful, modern, client-side feed application that displays documents from Dash Platform using the Dash Platform Extension.

## Features

- 🎨 Beautiful, modern UI with Tailwind CSS
- 🌐 100% client-side - no backend required
- 🔌 Integrates with Dash Platform Extension
- 🧪 Full mock mode for development
- 🔄 Real-time polling for new documents
- 📱 Fully responsive design
- 🌙 Dark mode support

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Dash Platform Extension (optional, for real data)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

### Using Mock Mode (Default)

By default, the app runs in mock mode showing sample data. This is perfect for development and testing without needing the extension.

### Using Real Extension

1. Install the [Dash Platform Extension](https://github.com/pshenmic/dash-platform-extension)
2. Import your identity using your AUTHENTICATION HIGH private key
3. Create a `.env` file:
```
VITE_USE_MOCK=false
```
4. Restart the dev server

## Configuration

Edit these values in `src/App.tsx` to connect to your data contract:

```typescript
const DATA_CONTRACT_ID = 'your-data-contract-id'
const DOCUMENT_TYPE = 'your-document-type'
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder. You can host these static files on any web server, CDN, or platforms like:
- GitHub Pages
- Netlify
- Vercel
- IPFS
- Any static file server

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

## Architecture

This is a 100% client-side application:
- No backend server needed
- No API keys or secrets
- Direct connection to Dash Platform via the extension
- All data fetched directly from the blockchain

## Security

- Your private keys never leave the extension
- The app only has access to the public SDK API
- No sensitive data is stored or transmitted by the app

## License

MIT