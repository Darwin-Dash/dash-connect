# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure with docs/ folder
- MIT License file
- CHANGELOG.md for version tracking
- CONTRIBUTING.md for contribution guidelines
- API documentation for SDK usage patterns
- Deployment guide for production hosting
- Troubleshooting guide consolidating all known issues
- Mock extension documentation
- Dual SDK architecture for optimal reading/writing separation
- Mock extension system for development without real extension
- Beautiful modern UI with Tailwind CSS v4
- Dark mode support with system preference detection
- Real-time document polling with background updates
- Network switching between testnet and mainnet
- Transaction status tracking with pending state management
- Comprehensive test suite with unit, integration, and E2E tests
- Visual regression testing with Playwright
- Automated test runner for mock extension validation
- Buffer polyfill for browser compatibility
- Extension detection with graceful degradation
- Error boundaries for robust error handling

### Changed
- Moved technical documentation to organized docs/ folder structure
- Updated README.md with clearer structure and badges
- Enhanced CLAUDE.md with complete project state information

### Fixed
- Buffer compatibility issues in browser environment
- Extension detection timing issues
- Mock extension conflicts with real wallet extensions
- WASM object conversion for proper document display
- Nonce management for reliable transaction submission

### Security
- Private keys never leave browser extension
- Read-only mode when extension not available
- Proper CSP headers recommended for production
- Input validation for all user inputs

## [0.0.0] - 2025-01-26

### Initial Release
- Basic feed application structure
- Integration with Dash Platform Extension
- Document querying and display
- Publishing functionality with extension
- Responsive design with Tailwind CSS
- TypeScript support
- React 19 with modern hooks
- Zustand for state management
- Vite for fast development and building

[Unreleased]: https://github.com/dash-feed-app/dash-feed-app/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/dash-feed-app/dash-feed-app/releases/tag/v0.0.0