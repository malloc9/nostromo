#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying GitHub Pages Deployment Setup...\n');

const checks = [
  {
    name: 'GitHub Actions Workflow',
    path: '.github/workflows/deploy.yml',
    required: true
  },
  {
    name: 'Package.json Configuration',
    path: 'package.json',
    required: true,
    validate: (content) => {
      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts.build && pkg.devDependencies;
    }
  },
  {
    name: 'Build Script',
    path: 'scripts/build.js',
    required: true
  },
  {
    name: 'Development Server',
    path: 'scripts/dev-server.js',
    required: true
  },
  {
    name: 'Deployment Documentation',
    path: 'DEPLOYMENT.md',
    required: true
  },
  {
    name: 'Jekyll Bypass File',
    path: '.nojekyll',
    required: true
  },
  {
    name: 'Robots.txt',
    path: 'robots.txt',
    required: true
  },
  {
    name: 'Built Distribution',
    path: 'dist/index.html',
    required: true
  },
  {
    name: 'Built CSS Assets',
    path: 'dist/css/main.css',
    required: true
  },
  {
    name: 'Built JavaScript Assets',
    path: 'dist/js/app.js',
    required: true
  },
  {
    name: 'GitHub Pages 404 Handler',
    path: 'dist/404.html',
    required: true
  },
  {
    name: 'Build Information',
    path: 'dist/build-info.json',
    required: true,
    validate: (content) => {
      const info = JSON.parse(content);
      return info.buildTime && info.version && info.environment;
    }
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  process.stdout.write(`Checking ${check.name}... `);
  
  try {
    if (fs.existsSync(check.path)) {
      if (check.validate) {
        const content = fs.readFileSync(check.path, 'utf8');
        if (check.validate(content)) {
          console.log('✅ PASS');
          passed++;
        } else {
          console.log('❌ FAIL (validation failed)');
          failed++;
        }
      } else {
        console.log('✅ PASS');
        passed++;
      }
    } else {
      console.log('❌ FAIL (missing)');
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL (error: ${error.message})`);
    failed++;
  }
}

console.log('\n📊 Deployment Verification Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All deployment checks passed! Ready for GitHub Pages deployment.');
  console.log('\n📋 Next Steps:');
  console.log('1. Commit and push changes to main/master branch');
  console.log('2. Enable GitHub Pages in repository settings');
  console.log('3. Set source to "GitHub Actions"');
  console.log('4. Monitor deployment in Actions tab');
} else {
  console.log('\n⚠️  Some deployment checks failed. Please review and fix issues before deploying.');
  process.exit(1);
}

// Additional deployment readiness checks
console.log('\n🔧 Additional Deployment Information:');

// Check file sizes
const distPath = 'dist';
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath, { recursive: true });
  let totalSize = 0;
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.statSync(filePath).isFile()) {
      totalSize += fs.statSync(filePath).size;
    }
  });
  
  console.log(`📦 Total build size: ${(totalSize / 1024).toFixed(2)} KB`);
}

// Check for potential issues
const potentialIssues = [];

if (!fs.existsSync('dist/.nojekyll')) {
  potentialIssues.push('Missing .nojekyll file in dist/ - Jekyll may process files');
}

if (fs.existsSync('dist/index.html')) {
  const indexContent = fs.readFileSync('dist/index.html', 'utf8');
  if (indexContent.includes('src="/') || indexContent.includes('href="/')) {
    potentialIssues.push('Absolute paths detected in HTML - may cause loading issues on GitHub Pages');
  }
}

if (potentialIssues.length > 0) {
  console.log('\n⚠️  Potential Issues:');
  potentialIssues.forEach(issue => console.log(`   • ${issue}`));
} else {
  console.log('✅ No potential deployment issues detected');
}