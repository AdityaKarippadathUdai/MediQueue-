/// <reference lib="webworker" />
import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {NavigationRoute, registerRoute} from 'workbox-routing';
import {NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

registerRoute(
  ({request}) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'queue-cure-pages',
  }),
);

registerRoute(
  ({request}) => ['script', 'style', 'image', 'font'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'queue-cure-assets',
  }),
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
