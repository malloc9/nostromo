# GitHub Pages Setup Guide

This guide will help you resolve the "Not Found" error and properly configure GitHub Pages for the Nostromo Monitoring System.

## Error: "buildHttpError: Not Found"

This error occurs when GitHub Pages is not properly enabled or configured for your repository.

## Step-by-Step Setup

### 1. Enable GitHub Pages in Repository Settings

1. **Go to your GitHub repository**
2. **Click on "Settings" tab** (top navigation)
3. **Scroll down to "Pages" section** (left sidebar)
4. **Configure the source:**
   - Source: Select "GitHub Actions"
   - This should be the only option you need to set

### 2. Verify Repository Permissions

1. **In Settings → Actions → General:**
   - Workflow permissions: Select "Read and write permissions"
   - Allow GitHub Actions to create and approve pull requests: ✅ Checked

2. **In Settings → Environments:**
   - You should see a "github-pages" environment created automatically
   - If not, it will be created on first deployment

### 3. Check Repository Visibility

- **Public repositories:** GitHub Pages works automatically
- **Private repositories:** Requires GitHub Pro, Team, or Enterprise plan

### 4. Verify Branch Protection

If you have branch protection rules:
- Ensure the workflow has permission to deploy
- Consider adding the GitHub Actions bot as an exception

## Alternative Setup Method

If the automatic setup doesn't work, try this manual approach:

### Option 1: Use gh-pages Branch (Traditional Method)

Update the workflow to use the traditional gh-pages branch method:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then in repository settings:
- Source: "Deploy from a branch"
- Branch: "gh-pages" / "/ (root)"

### Option 2: Manual Deployment

If automated deployment continues to fail:

1. **Build locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Install gh-pages utility:**
   ```bash
   npm install -g gh-pages
   ```

3. **Deploy manually:**
   ```bash
   gh-pages -d dist
   ```

4. **Configure Pages source:**
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "gh-pages"

## Troubleshooting Common Issues

### Issue 1: "Pages is not enabled"

**Solution:**
1. Go to Settings → Pages
2. Select "GitHub Actions" as source
3. Save the configuration
4. Re-run the workflow

### Issue 2: "Insufficient permissions"

**Solution:**
1. Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. Save changes
4. Re-run the workflow

### Issue 3: "Repository not found"

**Solution:**
1. Verify repository name in workflow
2. Check if repository is public (or you have GitHub Pro for private repos)
3. Ensure you have admin access to the repository

### Issue 4: "Build fails but Pages works"

**Solution:**
1. Check the Actions tab for detailed error logs
2. Verify all dependencies are in package.json
3. Test build locally: `npm run build`

## Verification Steps

After setup, verify everything works:

1. **Check Actions tab:**
   - Workflow should run successfully
   - Green checkmarks for all steps

2. **Check Pages settings:**
   - Should show "Your site is published at [URL]"
   - URL should be accessible

3. **Test the deployed site:**
   - All assets should load
   - Navigation should work
   - No console errors

## Repository Settings Checklist

- [ ] Repository is public (or you have GitHub Pro+)
- [ ] Pages is enabled in Settings → Pages
- [ ] Source is set to "GitHub Actions"
- [ ] Actions have "Read and write permissions"
- [ ] Workflow file is in `.github/workflows/`
- [ ] Main/master branch exists and has the code

## Getting Help

If you continue to have issues:

1. **Check GitHub Status:** https://www.githubstatus.com/
2. **Review GitHub Pages documentation:** https://docs.github.com/en/pages
3. **Check the Actions logs** for detailed error messages
4. **Verify your GitHub plan** supports Pages for private repos (if applicable)

## Quick Fix Commands

If you need to quickly deploy manually:

```bash
# Build the project
npm run build

# Deploy using gh-pages (install first if needed)
npx gh-pages -d dist

# Or use GitHub CLI (if installed)
gh workflow run deploy.yml
```

---

**Note:** After making any changes to repository settings, wait a few minutes and then re-run the GitHub Actions workflow.