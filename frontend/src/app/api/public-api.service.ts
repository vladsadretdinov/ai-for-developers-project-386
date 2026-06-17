import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import type { Booking, BookingCreate, EventType, SlotList } from './models';

/** Guest-facing operations (`/public/*`) from the API contract. */
@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** GET /public/event-types */
  listEventTypes(): Observable<EventType[]> {
    return this.http.get<EventType[]>(`${this.base}/public/event-types`);
  }

  /** GET /public/event-types/{eventTypeId} */
  getEventType(eventTypeId: string): Observable<EventType> {
    return this.http.get<EventType>(
      `${this.base}/public/event-types/${encodeURIComponent(eventTypeId)}`,
    );
  }

  /** GET /public/event-types/{eventTypeId}/slots */
  listSlots(eventTypeId: string, from?: string): Observable<SlotList> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    return this.http.get<SlotList>(
      `${this.base}/public/event-types/${encodeURIComponent(eventTypeId)}/slots`,
      { params },
    );
  }

  /** POST /public/bookings */
  createBooking(payload: BookingCreate): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/public/bookings`, payload);
  }
}
