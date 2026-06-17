import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import type {
  Booking,
  BookingStatus,
  EventType,
  EventTypeCreate,
  Owner,
} from './models';

/** Owner-facing operations (`/admin/*`) from the API contract. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** GET /admin/owner */
  getOwner(): Observable<Owner> {
    return this.http.get<Owner>(`${this.base}/admin/owner`);
  }

  /** GET /admin/event-types */
  listEventTypes(): Observable<EventType[]> {
    return this.http.get<EventType[]>(`${this.base}/admin/event-types`);
  }

  /** GET /admin/event-types/{eventTypeId} */
  getEventType(eventTypeId: string): Observable<EventType> {
    return this.http.get<EventType>(
      `${this.base}/admin/event-types/${encodeURIComponent(eventTypeId)}`,
    );
  }

  /** POST /admin/event-types */
  createEventType(payload: EventTypeCreate): Observable<EventType> {
    return this.http.post<EventType>(`${this.base}/admin/event-types`, payload);
  }

  /** PUT /admin/event-types/{eventTypeId} */
  updateEventType(
    eventTypeId: string,
    payload: EventTypeCreate,
  ): Observable<EventType> {
    return this.http.put<EventType>(
      `${this.base}/admin/event-types/${encodeURIComponent(eventTypeId)}`,
      payload,
    );
  }

  /** DELETE /admin/event-types/{eventTypeId} */
  deleteEventType(eventTypeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/admin/event-types/${encodeURIComponent(eventTypeId)}`,
    );
  }

  /** GET /admin/bookings */
  listBookings(options?: {
    from?: string;
    to?: string;
    status?: BookingStatus;
  }): Observable<Booking[]> {
    let params = new HttpParams();
    if (options?.from) params = params.set('from', options.from);
    if (options?.to) params = params.set('to', options.to);
    if (options?.status) params = params.set('status', options.status);
    return this.http.get<Booking[]>(`${this.base}/admin/bookings`, { params });
  }

  /** GET /admin/bookings/{bookingId} */
  getBooking(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(
      `${this.base}/admin/bookings/${encodeURIComponent(bookingId)}`,
    );
  }

  /** DELETE /admin/bookings/{bookingId} — cancel a booking. */
  cancelBooking(bookingId: string): Observable<Booking> {
    return this.http.delete<Booking>(
      `${this.base}/admin/bookings/${encodeURIComponent(bookingId)}`,
    );
  }
}
