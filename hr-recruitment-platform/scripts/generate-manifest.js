#!/usr/bin/env node

/**
 * Generate manifest.json for NOVUMFLOW HR Platform PWA
 * Creates a comprehensive PWA manifest for better mobile experience
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the PWA manifest
const manifest = {
  name: "NOVUMFLOW - Advanced HR Platform",
  short_name: "NOVUMFLOW",
  description: "Advanced HR Platform with AI Automation - Saving 60+ hours weekly and delivering 176% ROI",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#3b82f6",
  orientation: "portrait-primary",
  scope: "/",
  lang: "en",
  dir: "ltr",
  categories: ["business", "productivity", "utilities"],
  icons: [
    {
      src: "/favicon.ico",
      sizes: "16x16 32x32",
      type: "image/x-icon"
    },
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  ],
  shortcuts: [
    {
      name: "Dashboard",
      short_name: "Dashboard",
      description: "View HR Dashboard",
      url: "/dashboard",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192"
        }
      ]
    },
    {
      name: "Recruitment",
      short_name: "Recruitment",
      description: "Manage Recruitment Process",
      url: "/recruitment",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192"
        }
      ]
    },
    {
      name: "Documents",
      short_name: "Documents",
      description: "HR Documents Management",
      url: "/documents",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192"
        }
      ]
    }
  ],
  related_applications: [],
  prefer_related_applications: false,
  display_override: ["window-controls-overlay", "standalone"],
  edge_side_panel: {},
  launch_handler: {
    client_mode: "navigate-existing"
  }
};

// Write manifest to public and dist directories
function generateManifest() {
  const manifestContent = JSON.stringify(manifest, null, 2);
  
  // Write to public directory (for development)
  const publicDir = path.join(process.cwd(), 'public');
  const publicManifestPath = path.join(publicDir, 'manifest.json');
  
  // Write to dist directory (for production)
  const distDir = path.join(process.cwd(), 'dist');
  const distManifestPath = path.join(distDir, 'manifest.json');
  
  try {
    // Ensure directories exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Write to public directory
    fs.writeFileSync(publicManifestPath, manifestContent, 'utf8');
    console.log('✅ Manifest generated in public directory:', publicManifestPath);
    
    // Write to dist directory
    fs.writeFileSync(distManifestPath, manifestContent, 'utf8');
    console.log('✅ Manifest generated in dist directory:', distManifestPath);
    
    console.log('📱 PWA manifest generated successfully');
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
  }
}

// Run the script
generateManifest();

export { generateManifest, manifest };