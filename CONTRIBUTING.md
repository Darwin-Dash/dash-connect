# Contributing to Dash Feed App

Thank you for your interest in contributing to the Dash Feed App! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/dash-feed-app.git
   cd dash-feed-app
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original/dash-feed-app.git
   ```

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Git
- A code editor (VS Code recommended)
- Dash Platform Extension (optional, for testing real functionality)

### Initial Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers for E2E testing:
   ```bash
   npx playwright install
   ```

3. Create a `.env` file (optional):
   ```bash
   # Copy from .env.example and update with your values
   cp .env.example .env
   
   # Required environment variables (all need VITE_ prefix for Vite):
   VITE_DATA_CONTRACT_ID=your_data_contract_id
   VITE_IDENTITY_ID=your_identity_id
   VITE_IDENTITY_PRIVATE_KEY=your_private_key  # Only for direct signing
   VITE_NETWORK=testnet
   
   # For development with mock extension (default)
   VITE_USE_MOCK_EXTENSION=true
   
   # For testing with real extension
   # VITE_USE_MOCK_EXTENSION=false
   ```

4. Start the development server:
   ```bash
   npm run dev          # Standard development
   npm run dev:mock     # With mock extension
   ```

## Development Workflow

### Branch Strategy

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Keep your branch up to date:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Making Changes

1. **Follow the existing code structure** - Check similar files for patterns
2. **Write tests** - Add tests for new functionality
3. **Update documentation** - Keep docs in sync with code changes
4. **Check TypeScript** - Ensure no type errors
5. **Run linter** - Fix any linting issues

### Before Committing

Always run these checks before committing:

```bash
# Run all tests
npm test

# Check TypeScript compilation
npm run build

# Run linter
npm run lint

# Run E2E tests
npm run test:e2e
```

## Testing

### Running Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm run test:run

# Unit tests with UI
npm run test:ui

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Mock extension tests
npm run test:mock

# All tests
npm run test:all
```

### Writing Tests

- Place unit tests next to the code they test (e.g., `dash-service.test.ts`)
- Place E2E tests in the `e2e/` directory
- Use descriptive test names that explain what is being tested
- Test both success and error cases
- Use the mock extension for predictable testing

Example test structure:
```typescript
describe('DashService', () => {
  describe('queryDocuments', () => {
    it('should return documents from the blockchain', async () => {
      // Test implementation
    });
    
    it('should handle network errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use proper prop typing with TypeScript
- Follow the existing component structure

### CSS/Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Avoid inline styles
- Use CSS custom properties for theme values

### File Organization

```
src/
├── components/     # React components
├── lib/           # Core business logic
├── hooks/         # Custom React hooks
├── stores/        # Zustand stores
├── contexts/      # React contexts
├── types/         # TypeScript type definitions
└── test/          # Test utilities and setup
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(feed): add real-time document updates

Implement WebSocket connection for live updates
- Add WebSocket client in dash-service
- Update feed store to handle real-time events
- Add connection status indicator

Closes #123
```

```bash
fix(extension): handle popup timeout correctly

Increase timeout to 3 minutes and show proper error message
when user doesn't respond to transaction approval popup
```

## Pull Request Process

1. **Update your branch** with the latest upstream changes
2. **Run all tests** and ensure they pass
3. **Update documentation** if needed
4. **Create a pull request** with a clear title and description

### PR Title Format

Use the same format as commit messages:
- `feat(component): add new feature`
- `fix(service): resolve connection issue`
- `docs: update API documentation`

### PR Description Template

```markdown
## Summary
Brief description of what this PR does

## Changes
- List of specific changes
- Another change
- etc.

## Testing
- How to test these changes
- What to verify

## Screenshots (if UI changes)
Before | After
--- | ---
[screenshot] | [screenshot]

## Checklist
- [ ] Tests pass locally
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Documentation updated (if needed)
- [ ] Tested with mock extension
- [ ] Tested with real extension (if applicable)
```

## Reporting Issues

### Before Creating an Issue

1. Search existing issues to avoid duplicates
2. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
3. Try with the latest version

### Issue Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: macOS 14.0
- Extension Version: 1.0.0
- Network: testnet

## Additional Context
Any other relevant information, errors, or screenshots
```

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change existing behavior
- Fix bugs that were documented workarounds
- Add new configuration options
- Change the development setup

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update the table of contents
- Check for broken links
- Keep formatting consistent

### Key Documentation Files

- `README.md` - Project overview and quick start
- `DEVELOPER_GUIDE.md` - Comprehensive developer reference
- `docs/API.md` - SDK API documentation
- `docs/TROUBLESHOOTING.md` - Common issues and solutions
- `CLAUDE.md` - AI assistant context

## Questions?

If you have questions about contributing:

1. Check the [Developer Guide](DEVELOPER_GUIDE.md)
2. Look at existing code for examples
3. Open a discussion issue for guidance

Thank you for contributing to Dash Feed App! 🚀