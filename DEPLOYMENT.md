# Nostromo Monitoring System - Deployment Guide

This document provides comprehensive instructions for deploying the Nostromo Monitoring System to GitHub Pages and maintaining the deployment.

## Overview

The Nostromo Monitoring System is deployed as a static web application using GitHub Pages with automated deployment via GitHub Actions. The deployment process includes asset optimization, minification, and GitHub Pages-specific configuration.

## Prerequisites

- GitHub repository with the project code
- Node.js 16+ installed locally for development
- GitHub Pages enabled in repository settings

## Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Source Code   │───▶│  GitHub Actions  │───▶│  GitHub Pages   │
│   (main branch) │    │   Build Process  │    │   (gh-pages)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Automated Deployment

### GitHub Actions Workflow

The deployment is handled by `.github/workflows/deploy.yml` which:

1. **Triggers on:**
   - Push to `main` or `master` branch
   - Manual workflow dispatch
   - Pull requests (build only, no deploy)

2. **Build Process:**
   - Installs Node.js dependencies
   - Runs the build script to optimize assets
   - Creates optimized static files in `dist/` directory
   - Uploads build artifacts

3. **Deploy Process:**
   - Deploys to GitHub Pages environment
   - Updates the live site automatically

### Build Script Features

The `scripts/build.js` performs the following optimizations:

- **HTML Minification:** Removes whitespace, comments, and redundant attributes
- **CSS Optimization:** Minifies stylesheets and removes unused code
- **JavaScript Minification:** Compresses JS files while preserving functionality
- **Asset Copying:** Transfers static assets (images, fonts, audio)
- **GitHub Pages Configuration:** Creates `.nojekyll` and `404.html` files
- **Build Validation:** Ensures all required files are present

## Manual Deployment

### Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - Serves files at `http://localhost:3000`
   - Includes SPA routing support
   - Hot reload for development

3. **Build for Production:**
   ```bash
   npm run build
   ```
   - Creates optimized files in `dist/` directory
   - Ready for deployment to any static hosting

### Manual GitHub Pages Deployment

If automatic deployment fails, you can deploy manually:

1. **Build the Project:**
   ```bash
   npm run build
   ```

2. **Deploy to gh-pages Branch:**
   ```bash
   # Install gh-pages utility (if not already installed)
   npm install -g gh-pages
   
   # Deploy dist folder to gh-pages branch
   gh-pages -d dist
   ```

## Repository Configuration

### GitHub Pages Settings

1. **Navigate to Repository Settings:**
   - Go to your GitHub repository
   - Click on "Settings" tab
   - Scroll to "Pages" section

2. **Configure Source:**
   - Source: "GitHub Actions"
   - This enables the automated workflow deployment

3. **Custom Domain (Optional):**
   - Add custom domain if desired
   - Ensure DNS is configured properly

### Environment Variables

The following environment variables are available during build:

- `GITHUB_SHA`: Git commit hash (automatically set by GitHub Actions)
- `NODE_ENV`: Set to 'production' during build
- `PORT`: Development server port (default: 3000)

## File Structure

### Source Files
```
/
├── index.html              # Main application entry
├── css/                    # Stylesheets
│   ├── main.css           # Core styling
│   └── terminal.css       # Terminal effects
├── js/                     # JavaScript modules
│   ├── app.js             # Main application
│   ├── router.js          # Navigation system
│   └── [other modules]    # System-specific modules
├── assets/                 # Static assets
│   ├── fonts/             # Custom fonts
│   ├── audio/             # Sound effects
│   └── images/            # UI graphics
└── scripts/               # Build tools
    ├── build.js           # Production build
    └── dev-server.js      # Development server
```

### Built Files (dist/)
```
dist/
├── index.html              # Minified HTML
├── css/                    # Optimized stylesheets
├── js/                     # Minified JavaScript
├── assets/                 # Copied static assets
├── .nojekyll              # GitHub Pages config
├── 404.html               # SPA routing fallback
└── build-info.json        # Build metadata
```

## Troubleshooting

### Common Issues

1. **"buildHttpError: Not Found" - Pages Not Enabled:**
   - **Solution:** Go to Settings → Pages, select "GitHub Actions" as source
   - **Alternative:** Use the gh-pages branch method (see GITHUB_PAGES_SETUP.md)
   - **Verify:** Repository is public or you have GitHub Pro+ for private repos

2. **Build Fails:**
   - Check Node.js version (requires 16+)
   - Verify all dependencies are installed: `npm ci`
   - Check build logs in GitHub Actions tab

3. **Assets Not Loading:**
   - Ensure all asset paths are relative (no leading `/`)
   - Check that assets are copied to `dist/` directory
   - Verify `.nojekyll` file exists in deployment

4. **Routing Issues:**
   - Confirm `404.html` redirects to index.html
   - Check that hash-based routing is used (not browser history API)
   - Verify GitHub Pages is serving from correct branch

5. **GitHub Actions Permission Errors:**
   - Check repository settings → Actions → General
   - Ensure "Read and write permissions" are enabled
   - Verify Pages deployment permissions are set

6. **Pages Configuration Issues:**
   - See GITHUB_PAGES_SETUP.md for detailed setup instructions
   - Consider using the alternative gh-pages branch method
   - Verify repository settings and permissions

### Debug Steps

1. **Local Testing:**
   ```bash
   # Test development version
   npm run dev
   
   # Test production build locally
   npm run build
   cd dist
   python -m http.server 8000  # or any static server
   ```

2. **Check Build Output:**
   - Review GitHub Actions logs
   - Verify `dist/` directory contents
   - Check `build-info.json` for build metadata

3. **Validate Deployment:**
   - Test all navigation routes
   - Verify assets load correctly
   - Check browser console for errors
   - Test on different devices/browsers

## Maintenance

### Regular Tasks

1. **Dependency Updates:**
   ```bash
   # Check for outdated packages
   npm outdated
   
   # Update dependencies
   npm update
   ```

2. **Security Audits:**
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix automatically fixable issues
   npm audit fix
   ```

3. **Performance Monitoring:**
   - Monitor build times in GitHub Actions
   - Check deployed site performance with Lighthouse
   - Review asset sizes and optimization opportunities

### Version Management

1. **Release Process:**
   ```bash
   # Update version in package.json
   npm version patch  # or minor/major
   
   # Push changes and tags
   git push origin main --tags
   ```

2. **Rollback Procedure:**
   - Revert problematic commits
   - Redeploy previous working version
   - Monitor deployment status

## Performance Optimization

### Build Optimizations

- **CSS:** Minification, unused code removal
- **JavaScript:** Compression, dead code elimination
- **HTML:** Whitespace removal, attribute optimization
- **Assets:** Compression, format optimization

### Runtime Optimizations

- **Caching:** Proper cache headers for static assets
- **Preloading:** Critical resources preloaded in HTML
- **Lazy Loading:** Non-critical assets loaded on demand
- **Compression:** Gzip/Brotli compression enabled

## Security Considerations

### Content Security Policy

Consider adding CSP headers for enhanced security:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### Asset Integrity

For external resources, use Subresource Integrity (SRI):

```html
<script src="external-script.js" 
        integrity="sha384-hash" 
        crossorigin="anonymous"></script>
```

## Support and Contact

For deployment issues or questions:

1. Check GitHub Actions logs for build errors
2. Review this documentation for common solutions
3. Create an issue in the repository for persistent problems
4. Contact the development team for critical deployment issues

---

**Last Updated:** [Current Date]  
**Version:** 1.0.0  
**Deployment Target:** GitHub Pages