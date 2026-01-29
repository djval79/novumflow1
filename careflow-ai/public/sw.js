// Service Worker for CareFlow AI
// This file prevents MIME type errors during development

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the network handle all requests in development
  event.respondWith(fetch(event.request));
});