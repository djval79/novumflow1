#!/usr/bin/env node

/**
 * Generate sitemap.xml for NOVUMFLOW HR Platform
 * Creates a comprehensive sitemap for better SEO
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the base URL for the site
const BASE_URL = 'https://novumflow.netlify.app';

// Define all the routes in the application
const routes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/dashboard',
  '/recruitment',
  '/recruitment/settings',
  '/hr-module',
  '/documents',
  '/letters',
  '/settings',
  '/automation',
  '/biometric',
  '/compliance',
  '/messaging',
  '/noticeboard'
];

// Generate sitemap XML content
function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  routes.forEach(route => {
    // Determine priority and change frequency based on route
    let priority = '0.5';
    let changefreq = 'weekly';
    
    if (route === '/') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route === '/dashboard') {
      priority = '0.9';
      changefreq = 'daily';
    } else if (route.includes('settings') || route.includes('automation')) {
      priority = '0.7';
      changefreq = 'monthly';
    } else if (route === '/login' || route === '/signup') {
      priority = '0.8';
      changefreq = 'monthly';
    }

    sitemapContent += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  sitemapContent += `
</urlset>`;

  return sitemapContent;
}

// Write sitemap to dist directory
function writeSitemap() {
  const distDir = path.join(process.cwd(), 'dist');
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  const sitemapContent = generateSitemap();
  
  try {
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    console.log('✅ Sitemap generated successfully at:', sitemapPath);
    console.log(`📊 Generated ${routes.length} URLs in sitemap`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
writeSitemap();

export { generateSitemap, writeSitemap };