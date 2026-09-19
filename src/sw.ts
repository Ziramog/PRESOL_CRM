/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, BackgroundSyncPlugin, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const bgSyncPlugin = new BackgroundSyncPlugin('crm-offline-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 Hours
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ request }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    }
  ],
});

serwist.addEventListeners();
