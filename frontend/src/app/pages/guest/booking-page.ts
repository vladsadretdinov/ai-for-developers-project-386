import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../api/public-api.service';
import { AdminApiService } from '../../api/admin-api.service';
import type { Booking, EventType, Owner, Slot } from '../../api/models';
import { describeApiError } from '../../core/api-error';
import {
  formatDateLong,
  formatDateTime,
  formatTime,
  localDayKey,
} from '../../core/datetime';
import { MonthCalendarComponent } from '../../components/month-calendar';
import {
  ButtonDirective,
  CARD,
  InputDirective,
  LabelDirective,
  SpinnerComponent,
  TextareaDirective,
} from '../../ui';

@Component({
  selector: 'app-booking-page',
  imports: [
    FormsModule,
    RouterLink,
    MonthCalendarComponent,
    CARD,
    ButtonDirective,
    InputDirective,
    TextareaDirective,
    LabelDirective,
    SpinnerComponent,
  ],
  template: `
    <div class="mx-auto max-w-5xl px-4 py-10">
      <a routerLink="/" class="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >← Все типы встреч</a
      >

      @if (loading()) {
        <div class="flex justify-center py-20"><app-spinner class="h-6 w-6" /></div>
      } @else if (loadError()) {
        <app-card class="border-destructive/40">
          <app-card-content class="py-6 text-sm text-destructive">{{ loadError() }}</app-card-content>
        </app-card>
      } @else if (confirmed(); as b) {
        <!-- Confirmation -->
        <app-card class="mx-auto max-w-lg">
          <app-card-header class="items-center text-center">
            <div
              class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-2xl text-success"
            >
              ✓
            </div>
            <h2 appCardTitle class="text-xl">Встреча забронирована</h2>
            <p appCardDescription>На {{ b.guestEmail }} отправлено подтверждение.</p>
          </app-card-header>
          <app-card-content class="space-y-2 text-sm">
            <div class="flex justify-between border-t py-2">
              <span class="text-muted-foreground">Тип</span><span>{{ eventType()?.title }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Когда</span><span>{{ formatDT(b.start) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-muted-foreground">Гость</span><span>{{ b.guestName }}</span>
            </div>
          </app-card-content>
          <app-card-footer class="gap-2">
            <a appBtn variant="outline" routerLink="/" class="w-full">К списку</a>
            <button appBtn class="w-full" (click)="resetForAnother()">Новая запись</button>
          </app-card-footer>
        </app-card>
      } @else {
        <!-- Cal.com style 3-pane layout -->
        <app-card class="overflow-hidden">
          <div class="grid md:grid-cols-[260px_1fr_280px] md:divide-x">
            <!-- Left: event info -->
            <div class="space-y-4 p-6">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
                >
                  {{ ownerInitial() }}
                </div>
                <span class="text-sm text-muted-foreground">{{ owner()?.name ?? 'Владелец' }}</span>
              </div>
              <h1 class="text-xl font-bold">{{ eventType()?.title }}</h1>
              <div class="space-y-2 text-sm text-muted-foreground">
                <p class="flex items-center gap-2">🕒 {{ eventType()?.durationMinutes }} минут</p>
                @if (owner()?.timeZone) {
                  <p class="flex items-center gap-2">🌐 {{ owner()?.timeZone }}</p>
                }
              </div>
              @if (eventType()?.description) {
                <p class="text-sm leading-relaxed">{{ eventType()?.description }}</p>
              }
            </div>

            <!-- Center: calendar -->
            <div class="p-6">
              @if (slotsLoading()) {
                <div class="flex justify-center py-16"><app-spinner class="h-6 w-6" /></div>
              } @else {
                <app-month-calendar
                  [availableDays]="availableDays()"
                  [selected]="selectedDay()"
                  (daySelected)="selectDay($event)"
                />
              }
            </div>

            <!-- Right: times / form -->
            <div class="p-6">
              @if (!selectedDay()) {
                <p class="py-10 text-center text-sm text-muted-foreground">
                  Выберите день со свободными слотами.
                </p>
              } @else if (!selectedSlot()) {
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-sm font-semibold capitalize">{{ selectedDayLabel() }}</span>
                  <div class="flex rounded-md border p-0.5 text-xs">
                    <button
                      type="button"
                      (click)="hour12.set(false)"
                      [class]="toggleClass(!hour12())"
                    >
                      24ч
                    </button>
                    <button
                      type="button"
                      (click)="hour12.set(true)"
                      [class]="toggleClass(hour12())"
                    >
                      12ч
                    </button>
                  </div>
                </div>
                <div class="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                  @for (slot of slotsForSelectedDay(); track slot.start) {
                    <button
                      type="button"
                      (click)="selectSlot(slot)"
                      class="flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                    >
                      <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                      {{ time(slot.start) }}
                    </button>
                  }
                </div>
              } @else {
                <!-- Booking form -->
                <form (ngSubmit)="submit()" class="space-y-4">
                  <div class="rounded-md bg-muted px-3 py-2 text-sm">
                    <div class="font-medium capitalize">{{ selectedDayLabel() }}</div>
                    <div class="text-muted-foreground">{{ time(selectedSlot()!.start) }}</div>
                  </div>
                  <div class="space-y-1.5">
                    <label appLabel for="guestName">Имя *</label>
                    <input
                      appInput
                      id="guestName"
                      name="guestName"
                      [(ngModel)]="guestName"
                      required
                      maxlength="120"
                      [attr.aria-invalid]="fieldInvalid('guestName')"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label appLabel for="guestEmail">Email *</label>
                    <input
                      appInput
                      id="guestEmail"
                      name="guestEmail"
                      type="email"
                      [(ngModel)]="guestEmail"
                      required
                      [attr.aria-invalid]="fieldInvalid('guestEmail')"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label appLabel for="notes">Комментарий</label>
                    <textarea
                      appInput
                      id="notes"
                      name="notes"
                      [(ngModel)]="notes"
                      maxlength="2000"
                      rows="3"
                    ></textarea>
                  </div>

                  @if (submitError()) {
                    <p class="text-sm text-destructive">{{ submitError() }}</p>
                  }

                  <div class="flex gap-2">
                    <button
                      type="button"
                      appBtn
                      variant="outline"
                      class="flex-1"
                      (click)="clearSlot()"
                      [disabled]="submitting()"
                    >
                      Назад
                    </button>
                    <button appBtn type="submit" class="flex-1" [disabled]="submitting()">
                      @if (submitting()) {
                        <app-spinner class="h-4 w-4 text-primary-foreground" />
                      }
                      Подтвердить
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </app-card>
      }
    </div>
  `,
})
export class BookingPage {
  /** Bound from route param `:eventTypeId` via withComponentInputBinding(). */
  readonly eventTypeId = input.required<string>();

  private readonly api = inject(PublicApiService);
  private readonly adminApi = inject(AdminApiService);

  protected readonly eventType = signal<EventType | null>(null);
  protected readonly owner = signal<Owner | null>(null);
  protected readonly slots = signal<Slot[]>([]);
  protected readonly loading = signal(true);
  protected readonly slotsLoading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly selectedDay = signal<string | null>(null);
  protected readonly selectedSlot = signal<Slot | null>(null);
  protected readonly hour12 = signal(false);

  protected guestName = '';
  protected guestEmail = '';
  protected notes = '';
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly invalidFields = signal<string[]>([]);
  protected readonly confirmed = signal<Booking | null>(null);

  /** Slots grouped by local day key. */
  private readonly slotsByDay = computed(() => {
    const map = new Map<string, Slot[]>();
    for (const s of this.slots()) {
      const key = localDayKey(new Date(s.start));
      (map.get(key) ?? map.set(key, []).get(key)!).push(s);
    }
    return map;
  });

  protected readonly availableDays = computed(() => [...this.slotsByDay().keys()]);
  protected readonly slotsForSelectedDay = computed(() => {
    const day = this.selectedDay();
    return day ? (this.slotsByDay().get(day) ?? []) : [];
  });
  protected readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    return day ? formatDateLong(new Date(`${day}T00:00:00`)) : '';
  });

  constructor() {
    // input() is available synchronously with component input binding in ctor via effect-free read.
    queueMicrotask(() => this.load());
  }

  private load(): void {
    const id = this.eventTypeId();
    this.api.getEventType(id).subscribe({
      next: (et) => {
        this.eventType.set(et);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(describeApiError(err));
        this.loading.set(false);
      },
    });
    this.adminApi.getOwner().subscribe({ next: (o) => this.owner.set(o), error: () => {} });
    this.loadSlots();
  }

  private loadSlots(): void {
    this.slotsLoading.set(true);
    this.api.listSlots(this.eventTypeId()).subscribe({
      next: (list) => {
        this.slots.set(list.slots);
        this.slotsLoading.set(false);
      },
      error: (err) => {
        this.loadError.set(describeApiError(err));
        this.slotsLoading.set(false);
      },
    });
  }

  protected selectDay(key: string): void {
    this.selectedDay.set(key);
    this.selectedSlot.set(null);
  }

  protected selectSlot(slot: Slot): void {
    this.selectedSlot.set(slot);
    this.submitError.set(null);
  }

  protected clearSlot(): void {
    this.selectedSlot.set(null);
  }

  protected submit(): void {
    const slot = this.selectedSlot();
    if (!slot) return;
    if (!this.guestName.trim() || !this.guestEmail.trim()) {
      this.invalidFields.set([
        ...(this.guestName.trim() ? [] : ['guestName']),
        ...(this.guestEmail.trim() ? [] : ['guestEmail']),
      ]);
      this.submitError.set('Заполните имя и email.');
      return;
    }
    this.invalidFields.set([]);
    this.submitting.set(true);
    this.submitError.set(null);
    this.api
      .createBooking({
        eventTypeId: this.eventTypeId(),
        start: slot.start,
        guestName: this.guestName.trim(),
        guestEmail: this.guestEmail.trim(),
        notes: this.notes.trim() || undefined,
      })
      .subscribe({
        next: (booking) => {
          this.submitting.set(false);
          this.confirmed.set(booking);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(describeApiError(err));
          // If the slot was taken (409), refresh availability and step back.
          if (err?.status === 409) {
            this.selectedSlot.set(null);
            this.loadSlots();
          }
        },
      });
  }

  protected resetForAnother(): void {
    this.confirmed.set(null);
    this.selectedSlot.set(null);
    this.selectedDay.set(null);
    this.guestName = '';
    this.guestEmail = '';
    this.notes = '';
    this.loadSlots();
  }

  protected fieldInvalid(name: string): boolean | null {
    return this.invalidFields().includes(name) ? true : null;
  }

  protected time(iso: string): string {
    return formatTime(iso, this.hour12());
  }

  protected formatDT(iso: string): string {
    return formatDateTime(iso);
  }

  protected ownerInitial(): string {
    return (this.owner()?.name ?? 'B').trim().charAt(0).toUpperCase();
  }

  protected toggleClass(active: boolean): string {
    return active
      ? 'rounded px-2 py-1 bg-background shadow-sm font-medium'
      : 'rounded px-2 py-1 text-muted-foreground';
  }
}
