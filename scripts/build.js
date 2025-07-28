#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');

const srcDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '../dist');

// Build configuration
const config = {
  html: {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true
  },
  css: {
    level: 2,
    returnPromise: false
  },
  js: {
    compress: {
      drop_console: false, // Keep console logs for debugging
      drop_debugger: true
    },
    mangle: false, // Don't mangle names to preserve readability
    format: {
      comments: false
    }
  }
};

async function cleanDist() {
  console.log('🧹 Cleaning dist directory...');
  await fs.remove(distDir);
  await fs.ensureDir(distDir);
}

async function copyAssets() {
  console.log('📁 Copying assets...');
  
  // Copy assets directory if it exists
  const assetsDir = path.join(srcDir, 'assets');
  if (await fs.pathExists(assetsDir)) {
    await fs.copy(assetsDir, path.join(distDir, 'assets'));
  }
  
  // Copy any other static files
  const staticFiles = ['favicon.ico', 'robots.txt', '.nojekyll'];
  for (const file of staticFiles) {
    const srcFile = path.join(srcDir, file);
    if (await fs.pathExists(srcFile)) {
      await fs.copy(srcFile, path.join(distDir, file));
    }
  }
}

async function processCSS() {
  console.log('🎨 Processing CSS files...');
  
  const cssDir = path.join(srcDir, 'css');
  const distCssDir = path.join(distDir, 'css');
  
  await fs.ensureDir(distCssDir);
  
  const cssFiles = await fs.readdir(cssDir);
  const cleanCSS = new CleanCSS(config.css);
  
  for (const file of cssFiles) {
    if (path.extname(file) === '.css') {
      const srcFile = path.join(cssDir, file);
      const distFile = path.join(distCssDir, file);
      
      const cssContent = await fs.readFile(srcFile, 'utf8');
      const minified = cleanCSS.minify(cssContent);
      
      if (minified.errors.length > 0) {
        console.warn(`⚠️  CSS warnings for ${file}:`, minified.errors);
      }
      
      await fs.writeFile(distFile, minified.styles);
      console.log(`   ✅ ${file} (${cssContent.length} → ${minified.styles.length} bytes)`);
    }
  }
}

async function processJS() {
  console.log('⚡ Processing JavaScript files...');
  
  const jsDir = path.join(srcDir, 'js');
  const distJsDir = path.join(distDir, 'js');
  
  await fs.ensureDir(distJsDir);
  
  const jsFiles = await fs.readdir(jsDir);
  
  for (const file of jsFiles) {
    if (path.extname(file) === '.js') {
      const srcFile = path.join(jsDir, file);
      const distFile = path.join(distJsDir, file);
      
      const jsContent = await fs.readFile(srcFile, 'utf8');
      const minified = await minifyJS(jsContent, config.js);
      
      if (minified.error) {
        console.error(`❌ Error minifying ${file}:`, minified.error);
        // Copy original file if minification fails
        await fs.copy(srcFile, distFile);
      } else {
        await fs.writeFile(distFile, minified.code);
        console.log(`   ✅ ${file} (${jsContent.length} → ${minified.code.length} bytes)`);
      }
    }
  }
}

async function processHTML() {
  console.log('📄 Processing HTML files...');
  
  const htmlFiles = ['index.html'];
  
  for (const file of htmlFiles) {
    const srcFile = path.join(srcDir, file);
    const distFile = path.join(distDir, file);
    
    if (await fs.pathExists(srcFile)) {
      const htmlContent = await fs.readFile(srcFile, 'utf8');
      const minified = minifyHTML(htmlContent, config.html);
      
      await fs.writeFile(distFile, minified);
      console.log(`   ✅ ${file} (${htmlContent.length} → ${minified.length} bytes)`);
    }
  }
}

async function createGitHubPagesFiles() {
  console.log('🚀 Creating GitHub Pages configuration...');
  
  // Create .nojekyll file to prevent Jekyll processing
  await fs.writeFile(path.join(distDir, '.nojekyll'), '');
  
  // Create 404.html for SPA routing
  const notFoundHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOSTROMO MONITORING SYSTEM</title>
    <script>
        // Redirect to index.html for SPA routing
        window.location.href = '/';
    </script>
</head>
<body>
    <p>Redirecting to Nostromo Monitoring System...</p>
</body>
</html>`;
  
  await fs.writeFile(path.join(distDir, '404.html'), notFoundHTML);
  
  console.log('   ✅ .nojekyll created');
  console.log('   ✅ 404.html created');
}

async function generateBuildInfo() {
  console.log('ℹ️  Generating build information...');
  
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: require('../package.json').version,
    environment: 'production',
    gitHash: process.env.GITHUB_SHA || 'local-build'
  };
  
  await fs.writeFile(
    path.join(distDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('   ✅ build-info.json created');
}

async function validateBuild() {
  console.log('🔍 Validating build...');
  
  const requiredFiles = [
    'index.html',
    'css/main.css',
    'css/terminal.css',
    'js/app.js',
    'js/router.js',
    'js/data-simulator.js',
    '.nojekyll'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (await fs.pathExists(filePath)) {
      const stats = await fs.stat(filePath);
      console.log(`   ✅ ${file} (${stats.size} bytes)`);
    } else {
      console.error(`   ❌ Missing: ${file}`);
      allValid = false;
    }
  }
  
  if (!allValid) {
    throw new Error('Build validation failed - missing required files');
  }
  
  console.log('   🎉 Build validation passed!');
}

async function main() {
  try {
    console.log('🚀 Starting Nostromo Monitoring System build...\n');
    
    await cleanDist();
    await copyAssets();
    await processCSS();
    await processJS();
    await processHTML();
    await createGitHubPagesFiles();
    await generateBuildInfo();
    await validateBuild();
    
    console.log('\n✨ Build completed successfully!');
    console.log(`📦 Output directory: ${distDir}`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };