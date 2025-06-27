# Deployment Guide

This guide covers deploying the Dash Feed App to various hosting platforms. Since this is a 100% client-side application, it can be hosted on any static file server.

## Table of Contents

- [Build Process](#build-process)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
  - [GitHub Pages](#github-pages)
  - [Cloudflare Pages](#cloudflare-pages)
  - [Traditional Web Hosting](#traditional-web-hosting)
- [Production Configuration](#production-configuration)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Build Process

### Prerequisites

- Node.js 16+ and npm installed
- All dependencies installed (`npm install`)

### Building for Production

```bash
# Install dependencies
npm install

# Run production build
npm run build
```

This will:
1. Run TypeScript type checking
2. Build optimized production bundle with Vite
3. Generate static files in the `dist/` directory

### Build Output

```
dist/
├── index.html          # Main HTML file
├── assets/            # JS, CSS, and other assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── vite.svg           # Favicon
```

## Environment Variables

### Available Variables

```bash
# Network configuration
VITE_NETWORK=testnet                    # or 'mainnet'

# Data contract configuration
VITE_DATA_CONTRACT_ID=your-contract-id  # Override default contract

# Identity configuration
VITE_IDENTITY_ID=your-identity-id       # Override default identity

# Mock extension (development only)
VITE_USE_MOCK_EXTENSION=false          # Set to true for mock mode
```

### Setting Environment Variables

For production builds, create a `.env.production` file:

```bash
# .env.production
VITE_NETWORK=mainnet
VITE_DATA_CONTRACT_ID=production-contract-id
```

## Deployment Options

### Netlify

#### Method 1: Drag and Drop

1. Build the project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder to the deployment area
4. Your app is live!

#### Method 2: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Configure build settings:
   ```
   Build command: npm run build
   Publish directory: dist
   ```
4. Deploy automatically on push

#### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Netlify Configuration

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Vercel

#### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
npm run build
vercel --prod
```

#### Method 2: Git Integration

1. Import project on [vercel.com](https://vercel.com)
2. Configure:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### GitHub Pages

#### Setup

1. Install deployment package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Configure Vite for GitHub Pages:
   ```javascript
   // vite.config.ts
   export default defineConfig({
     base: '/your-repo-name/',
     // ... other config
   });
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

#### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Cloudflare Pages

#### Method 1: Direct Upload

1. Build locally: `npm run build`
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Upload `dist/` folder

#### Method 2: Git Integration

1. Connect GitHub repository
2. Configure build:
   ```
   Build command: npm run build
   Build output directory: dist
   ```

#### Cloudflare Configuration

Create `_headers` file in `public/`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

### Traditional Web Hosting

For Apache, Nginx, or any static file server:

1. Build the project: `npm run build`
2. Upload contents of `dist/` to your web server
3. Configure server for SPA routing

#### Apache (.htaccess)

Create `.htaccess` in `dist/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
Header set X-Content-Type-Options "nosniff"
Header set Referrer-Policy "strict-origin-when-cross-origin"
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Production Configuration

### Content Security Policy

Add CSP headers for production:

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.dashevo.org wss://*.dashevo.org;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

### Network Configuration

For production deployment:

```javascript
// src/contexts/NetworkContext.tsx
const NETWORK_CONFIGS = {
  testnet: {
    dataContractId: 'testnet-contract-id',
    blockExplorerUrl: 'https://testnet-insight.dashevo.org'
  },
  mainnet: {
    dataContractId: 'PRODUCTION-CONTRACT-ID', // Update this!
    blockExplorerUrl: 'https://insight.dashevo.org'
  }
};
```

## Security Considerations

### 1. HTTPS Required

Always deploy with HTTPS to ensure:
- Secure extension communication
- Protection against man-in-the-middle attacks
- Browser security features work properly

### 2. Security Headers

Essential headers for production:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 3. Environment Variables

- Never commit sensitive data
- Use platform-specific environment variable management
- Keep production configs separate from development

### 4. Extension Security

- The app never has access to private keys
- All signing happens in the extension
- Validate all data from the extension

## Performance Optimization

### 1. Enable Compression

Most platforms handle this automatically, but verify:
- Gzip or Brotli compression enabled
- Text files (HTML, CSS, JS) are compressed

### 2. Cache Headers

Configure appropriate cache headers:

```
# Static assets (JS, CSS with hash)
Cache-Control: public, max-age=31536000, immutable

# index.html
Cache-Control: no-cache, no-store, must-revalidate

# Other assets
Cache-Control: public, max-age=3600
```

### 3. CDN Configuration

If using a CDN:
- Enable edge caching for assets
- Disable caching for index.html
- Configure proper CORS headers

### 4. Bundle Optimization

The Vite build already optimizes, but verify:
- Code splitting works properly
- Tree shaking removes unused code
- Assets are minified

## Post-Deployment Checklist

### Functionality Testing

- [ ] App loads without console errors
- [ ] Extension detection works
- [ ] Documents load from blockchain
- [ ] Publishing works with extension
- [ ] Network switching functions properly
- [ ] Dark mode toggles correctly

### Performance Testing

- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No blocking resources
- [ ] Images optimized

### Security Testing

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No exposed sensitive data
- [ ] CSP policy active

### Monitoring Setup

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics installed (if desired)
- [ ] Uptime monitoring active
- [ ] Performance monitoring enabled

### Documentation

- [ ] Update README with production URL
- [ ] Document any custom configuration
- [ ] Note deployment platform specifics
- [ ] Update environment variables documentation

## Troubleshooting Deployment

### Common Issues

**White screen after deployment**
- Check browser console for errors
- Verify base URL configuration
- Ensure all files uploaded correctly

**Extension not detected**
- Verify HTTPS is enabled
- Check for CSP blocking extension
- Test in different browsers

**404 errors on refresh**
- Configure SPA routing on server
- Add rewrite rules for your platform

**Slow initial load**
- Enable compression
- Check bundle size
- Verify CDN configuration

### Debug Deployment

Add temporary debug logging:

```javascript
// Temporary for deployment debugging
console.log('App version:', import.meta.env.VITE_APP_VERSION);
console.log('Network:', import.meta.env.VITE_NETWORK);
console.log('Extension available:', !!window.dashPlatformSDK);
```

Remember to remove debug logs before final production deployment!

## Conclusion

The Dash Feed App's static nature makes it easy to deploy anywhere. Choose the platform that best fits your needs, follow the security guidelines, and use the post-deployment checklist to ensure a successful launch.