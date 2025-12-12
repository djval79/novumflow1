#!/usr/bin/env node

/**
 * NOVUMFLOW Login Diagnostic Tool
 * 
 * Run this script to diagnose login issues
 * Usage: node diagnose-login.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 NOVUMFLOW Login Diagnostic Tool\n');
console.log('=' .repeat(50));

// Check 1: .env.local file
console.log('\n📁 CHECK 1: Environment File');
console.log('-'.repeat(50));

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  if (hasUrl) {
    console.log('✅ VITE_SUPABASE_URL is defined');
    // Extract URL for testing
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    if (urlMatch && urlMatch[1] && !urlMatch[1].includes('your_')) {
      console.log(`   URL: ${urlMatch[1]}`);
    } else {
      console.log('⚠️  URL appears to be placeholder value');
    }
  } else {
    console.log('❌ VITE_SUPABASE_URL is NOT defined');
  }
  
  if (hasKey) {
    console.log('✅ VITE_SUPABASE_ANON_KEY is defined');
  } else {
    console.log('❌ VITE_SUPABASE_ANON_KEY is NOT defined');
  }
} else {
  console.log('❌ .env.local file does NOT exist');
  console.log('   Action: Copy .env.example to .env.local');
  console.log('   Command: cp .env.example .env.local');
}

// Check 2: package.json
console.log('\n📦 CHECK 2: Dependencies');
console.log('-'.repeat(50));

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg.dependencies && pkg.dependencies['@supabase/supabase-js']) {
    console.log('✅ @supabase/supabase-js is installed');
    console.log(`   Version: ${pkg.dependencies['@supabase/supabase-js']}`);
  } else {
    console.log('❌ @supabase/supabase-js is NOT installed');
    console.log('   Action: npm install @supabase/supabase-js');
  }
  
  if (pkg.dependencies && pkg.dependencies['@tanstack/react-query']) {
    console.log('✅ @tanstack/react-query is installed');
  }
} else {
  console.log('❌ package.json not found');
}

// Check 3: Supabase connection (if URL available)
console.log('\n🌐 CHECK 3: Network Connectivity');
console.log('-'.repeat(50));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  
  if (urlMatch && urlMatch[1]) {
    const supabaseUrl = urlMatch[1].trim();
    
    if (!supabaseUrl.includes('your_') && supabaseUrl.startsWith('http')) {
      console.log(`Testing connection to: ${supabaseUrl}`);
      
      const url = new URL(supabaseUrl);
      const options = {
        hostname: url.hostname,
        path: '/rest/v1/',
        method: 'GET',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          console.log(`✅ Supabase is reachable (Status: ${res.statusCode})`);
          console.log('   Note: 401 is expected without API key');
        } else {
          console.log(`⚠️  Unexpected status: ${res.statusCode}`);
        }
      });
      
      req.on('error', (error) => {
        console.log('❌ Connection failed:', error.message);
        console.log('   Possible causes:');
        console.log('   - Internet connection issue');
        console.log('   - Supabase service is down');
        console.log('   - Firewall blocking connection');
      });
      
      req.on('timeout', () => {
        console.log('❌ Connection timeout');
        req.destroy();
      });
      
      req.end();
    } else {
      console.log('⚠️  URL appears to be placeholder or invalid');
      console.log('   Action: Set valid Supabase URL in .env.local');
    }
  }
} else {
  console.log('⏭️  Skipped (no .env.local file)');
}

// Check 4: Common issues
console.log('\n⚠️  CHECK 4: Common Issues');
console.log('-'.repeat(50));

const issues = [];

if (!fs.existsSync(envPath)) {
  issues.push({
    issue: 'Missing .env.local file',
    solution: 'Create .env.local from .env.example template',
    command: 'cp .env.example .env.local'
  });
}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('your_supabase_project_url_here')) {
    issues.push({
      issue: 'Placeholder values in .env.local',
      solution: 'Replace placeholder with actual Supabase credentials',
      command: 'Get credentials from https://app.supabase.com → Settings → API'
    });
  }
  
  if (!envContent.includes('VITE_SUPABASE_URL') || !envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    issues.push({
      issue: 'Missing required environment variables',
      solution: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
      command: 'Edit .env.local and add both variables'
    });
  }
}

if (issues.length > 0) {
  issues.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.issue}`);
    console.log(`   Solution: ${item.solution}`);
    console.log(`   Command: ${item.command}`);
  });
} else {
  console.log('✅ No common issues detected');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 SUMMARY');
console.log('='.repeat(50));

if (issues.length === 0 && fs.existsSync(envPath)) {
  console.log('✅ Configuration appears correct');
  console.log('\n🔍 If login still fails, check:');
  console.log('   1. Browser console for detailed errors (F12)');
  console.log('   2. User exists in Supabase Auth dashboard');
  console.log('   3. Email is confirmed');
  console.log('   4. CORS settings in Supabase dashboard');
  console.log('\n📚 See LOGIN_TROUBLESHOOTING_GUIDE.md for more help');
} else {
  console.log('⚠️  Issues detected - follow solutions above');
  console.log('\n📚 Complete guide: LOGIN_TROUBLESHOOTING_GUIDE.md');
}

console.log('\n' + '='.repeat(50));
console.log('🏁 Diagnostic Complete\n');
