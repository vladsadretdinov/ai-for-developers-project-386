import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../api/admin-api.service';
import type { Booking, BookingStatus } from '../../api/models';
import { describeApiError } from '../../core/api-error';
import { formatDateTime } from '../../core/datetime';
import { BadgeDirective, ButtonDirective, CARD, SpinnerComponent } from '../../ui';

@Component({
  selector: 'app-admin-bookings-page',
  imports: [RouterLink, CARD, BadgeDirective, ButtonDirective, SpinnerComponent],
  template: `
    <div class="mb-4 flex items-center gap-2">
      @for (f of filters; track f.value) {
        <button
          appBtn
          [variant]="status() === f.value ? 'default' : 'outline'"
          size="sm"
          (click)="setStatus(f.value)"
        >
          {{ f.label }}
        </button>
      }
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16"><app-spinner class="h-6 w-6" /></div>
    } @else if (error()) {
      <p class="text-sm text-destructive">{{ error() }}</p>
    } @else if (bookings().length === 0) {
      <app-card><app-card-content class="py-12 text-center text-muted-foreground">
        Нет встреч по выбранному фильтру.
      </app-card-content></app-card>
    } @else {
      <div class="space-y-3">
        @for (b of bookings(); track b.id) {
          <app-card>
            <app-card-content class="flex flex-wrap items-center justify-between gap-4 py-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ b.guestName }}</span>
                  <span
                    appBadge
                    [variant]="b.status === 'confirmed' ? 'success' : 'secondary'"
                    >{{ b.status === 'confirmed' ? 'подтверждена' : 'отменена' }}</span
                  >
                </div>
                <div class="mt-1 text-sm text-muted-foreground">
                  {{ b.guestEmail }} · {{ formatDT(b.start) }}
                </div>
              </div>
              <div class="flex gap-2">
                <a appBtn variant="outline" size="sm" [routerLink]="[b.id]">Детали</a>
                @if (b.status === 'confirmed') {
                  <button
                    appBtn
                    variant="destructive"
                    size="sm"
                    (click)="cancel(b)"
                    [disabled]="cancellingId() === b.id"
                  >
                    Отменить
                  </button>
                }
              </div>
            </app-card-content>
          </app-card>
        }
      </div>
    }
  `,
})
export class AdminBookingsPage {
  private readonly api = inject(AdminApiService);

  protected readonly filters: { label: string; value: BookingStatus }[] = [
    { label: 'Подтверждённые', value: 'confirmed' },
    { label: 'Отменённые', value: 'cancelled' },
  ];

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<BookingStatus>('confirmed');
  protected readonly cancellingId = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  protected setStatus(s: BookingStatus): void {
    if (this.status() === s) return;
    this.status.set(s);
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listBookings({ status: this.status() }).subscribe({
      next: (list) => {
        this.bookings.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(describeApiError(err));
        this.loading.set(false);
      },
    });
  }

  protected cancel(b: Booking): void {
    if (!confirm(`Отменить встречу с ${b.guestName}?`)) return;
    this.cancellingId.set(b.id);
    this.api.cancelBooking(b.id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.reload();
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.error.set(describeApiError(err));
      },
    });
  }

  protected formatDT(iso: string): string {
    return formatDateTime(iso);
  }
}
