import { InjectionToken } from '@angular/core';

/**
 * Base URL for the Booking Calendar API (the contract from /tsp-output/openapi.yaml).
 *
 * In development requests go to `/api`, which the Angular dev-server proxies to a
 * separately running backend (Prism mock on :4010 by default — see proxy.conf.json).
 * Point this at a real backend by overriding the provider in app.config.ts.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
