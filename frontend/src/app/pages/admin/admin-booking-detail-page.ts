import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../api/admin-api.service';
import type { Booking } from '../../api/models';
import { describeApiError } from '../../core/api-error';
import { formatDateTime } from '../../core/datetime';
import { BadgeDirective, ButtonDirective, CARD, SpinnerComponent } from '../../ui';

@Component({
  selector: 'app-admin-booking-detail-page',
  imports: [RouterLink, CARD, BadgeDirective, ButtonDirective, SpinnerComponent],
  template: `
    <a routerLink="/admin/bookings" class="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >← Ко всем встречам</a
    >

    @if (loading()) {
      <div class="flex justify-center py-16"><app-spinner class="h-6 w-6" /></div>
    } @else if (error()) {
      <p class="text-sm text-destructive">{{ error() }}</p>
    } @else if (booking(); as b) {
      <app-card class="max-w-xl">
        <app-card-header>
          <div class="flex items-center justify-between">
            <h2 appCardTitle class="text-xl">{{ b.guestName }}</h2>
            <span appBadge [variant]="b.status === 'confirmed' ? 'success' : 'secondary'">
              {{ b.status === 'confirmed' ? 'подтверждена' : 'отменена' }}
            </span>
          </div>
        </app-card-header>
        <app-card-content class="space-y-1 text-sm">
          @for (row of rows(b); track row.label) {
            <div class="flex justify-between border-t py-2.5">
              <span class="text-muted-foreground">{{ row.label }}</span>
              <span class="text-right">{{ row.value }}</span>
            </div>
          }
        </app-card-content>
        @if (b.status === 'confirmed') {
          <app-card-footer>
            <button appBtn variant="destructive" (click)="cancel(b)" [disabled]="cancelling()">
              @if (cancelling()) { <app-spinner class="h-4 w-4 text-destructive-foreground" /> }
              Отменить встречу
            </button>
          </app-card-footer>
        }
      </app-card>
    }
  `,
})
export class AdminBookingDetailPage {
  readonly bookingId = input.required<string>();

  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);

  protected readonly booking = signal<Booking | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cancelling = signal(false);

  constructor() {
    queueMicrotask(() => this.load());
  }

  private load(): void {
    this.api.getBooking(this.bookingId()).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(describeApiError(err));
        this.loading.set(false);
      },
    });
  }

  protected rows(b: Booking): { label: string; value: string }[] {
    return [
      { label: 'Email', value: b.guestEmail },
      { label: 'Начало', value: formatDateTime(b.start) },
      { label: 'Окончание', value: formatDateTime(b.end) },
      { label: 'Тип события', value: b.eventTypeId },
      { label: 'Комментарий', value: b.notes || '—' },
      { label: 'Создана', value: formatDateTime(b.createdAt) },
    ];
  }

  protected cancel(b: Booking): void {
    if (!confirm('Отменить эту встречу?')) return;
    this.cancelling.set(true);
    this.api.cancelBooking(b.id).subscribe({
      next: (updated) => {
        this.cancelling.set(false);
        this.booking.set(updated);
      },
      error: (err) => {
        this.cancelling.set(false);
        this.error.set(describeApiError(err));
      },
    });
  }
}
