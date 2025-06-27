# Dash Feed App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC)](https://tailwindcss.com/)

A beautiful, modern, 100% client-side web application that displays documents from Dash Platform using a dual SDK architecture for optimal performance and user experience.

## ✨ Features

- **🏗️ Dual SDK Architecture** - Reading always works, publishing requires extension
- **🎨 Beautiful Modern UI** - Tailwind CSS v4 with glass morphism design
- **🌐 100% Client-Side** - No backend server or API keys required  
- **🔌 Extension Integration** - Seamless integration with Dash Platform Extension
- **🧪 Mock Development Mode** - Full mock extension for development
- **🔄 Real-Time Updates** - Auto-refresh every 30 seconds
- **📱 Fully Responsive** - Works on desktop, tablet, and mobile
- **🌙 Dark Mode** - Automatic system preference detection
- **⚡ Fast & Optimized** - Vite build with code splitting

## 📚 Table of Contents

- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Dash Platform Extension (optional, for publishing)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dash-feed-app/dash-feed-app.git
cd dash-feed-app

# Install dependencies
npm install

# Start development server with mock extension
npm run dev:mock

# Open in browser
open http://localhost:5173
```

### Using the Real Extension

1. Install the [Dash Platform Extension](https://github.com/pshenmic/dash-platform-extension)
2. Import your identity with your private key
3. Set environment variable:
   ```bash
   VITE_USE_MOCK_EXTENSION=false npm run dev
   ```

## 📖 Documentation

### Core Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and component structure
- **[API Documentation](docs/API.md)** - SDK usage and API patterns
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Comprehensive development reference
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and setup
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Deployment & Operations

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Mock Extension Guide](docs/MOCK-EXTENSION.md)** - Mock system documentation
- **[Test Cases](docs/TEST-CASES.md)** - Comprehensive test scenarios

### Project Information

- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Changelog](CHANGELOG.md)** - Version history and changes
- **[License](LICENSE)** - MIT License

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:mock         # Start with mock extension

# Testing  
npm test                 # Run unit tests (watch mode)
npm run test:run         # Run tests once
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Check TypeScript types
```

### Configuration

Environment variables (`.env`):

```bash
# Network configuration
VITE_NETWORK=testnet                    # or 'mainnet'

# Mock extension (development)
VITE_USE_MOCK_EXTENSION=true           # Enable mock mode

# Data contract (optional overrides)
VITE_DATA_CONTRACT_ID=your-contract-id
VITE_IDENTITY_ID=your-identity-id
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/        # Component and service tests
├── e2e/         # End-to-end browser tests  
└── visual/      # Visual regression tests
```

### Running Tests

```bash
# Unit tests
npm test                    # Watch mode
npm run test:run            # Single run

# E2E tests
npm run test:e2e            # Headless
npm run test:e2e:ui         # With UI

# Mock extension tests
npm run test:mock           # Test mock system
./test-mock-runner.sh       # Automated browser tests
```

## 🚢 Deployment

The app is 100% static and can be deployed anywhere:

### Quick Deploy to Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### Other Platforms

- **[Vercel](docs/DEPLOYMENT.md#vercel)** - `vercel --prod`
- **[GitHub Pages](docs/DEPLOYMENT.md#github-pages)** - `npm run deploy`  
- **[Cloudflare Pages](docs/DEPLOYMENT.md#cloudflare-pages)** - Direct upload
- **[Traditional Hosting](docs/DEPLOYMENT.md#traditional-web-hosting)** - Upload `dist/`

See the [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 🏗️ Architecture

### Dual SDK Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   Reading SDK   │     │  Extension SDK   │
│ (Always Works)  │     │ (When Available) │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│          Dash Service Layer             │
│    (Unified API with Dual SDKs)         │
└─────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ Reading always works without extension
- ✅ Publishing secure through extension
- ✅ Optimal performance and UX
- ✅ Clear separation of concerns

See the [Architecture Guide](docs/ARCHITECTURE.md) for detailed information.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Tips

- Use the mock extension for faster development
- Run tests before submitting PRs
- Follow the existing code style
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Dash Platform team for the SDK and platform
- Browser extension developers
- All contributors and testers

---

<p align="center">
  Built with ❤️ for the Dash community
</p>