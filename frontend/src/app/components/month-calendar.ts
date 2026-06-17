import { Component, computed, input, output, signal } from '@angular/core';
import {
  addDays,
  buildMonthGrid,
  formatMonthYear,
  localDayKey,
} from '../core/datetime';

/**
 * Month grid calendar (Monday-first), in the Cal.com style.
 * Highlights days that have available slots and lets the user pick a day.
 */
@Component({
  selector: 'app-month-calendar',
  template: `
    <div class="w-full">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold capitalize">{{ monthLabel() }}</h2>
        <div class="flex items-center gap-1">
          <button
            type="button"
            (click)="prevMonth()"
            [disabled]="!canGoPrev()"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <button
            type="button"
            (click)="nextMonth()"
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        @for (d of weekdays; track d) {
          <div class="py-2">{{ d }}</div>
        }
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1">
        @for (day of grid(); track day.key) {
          @let enabled = isSelectable(day.key);
          <button
            type="button"
            [disabled]="!enabled"
            (click)="pick(day.key)"
            [class]="cellClass(day, enabled)"
          >
            <span>{{ day.date.getDate() }}</span>
            @if (availableSet().has(day.key) && day.key !== selected()) {
              <span class="mt-0.5 h-1 w-1 rounded-full bg-success"></span>
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class MonthCalendarComponent {
  /** Day keys (YYYY-MM-DD) that have at least one available slot. */
  readonly availableDays = input<string[]>([]);
  readonly selected = input<string | null>(null);
  readonly daySelected = output<string>();

  protected readonly weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  protected readonly anchor = signal(new Date());

  protected readonly availableSet = computed(() => new Set(this.availableDays()));
  protected readonly grid = computed(() => buildMonthGrid(this.anchor()));
  protected readonly monthLabel = computed(() => formatMonthYear(this.anchor()));

  private readonly todayKey = localDayKey(new Date());
  private readonly windowEndKey = localDayKey(addDays(new Date(), 14));

  protected canGoPrev(): boolean {
    const a = this.anchor();
    const now = new Date();
    return a.getFullYear() > now.getFullYear() || a.getMonth() > now.getMonth();
  }

  protected prevMonth(): void {
    const a = this.anchor();
    this.anchor.set(new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const a = this.anchor();
    this.anchor.set(new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }

  protected isSelectable(key: string): boolean {
    return key >= this.todayKey && key <= this.windowEndKey;
  }

  protected pick(key: string): void {
    this.daySelected.emit(key);
  }

  protected cellClass(
    day: { key: string; inCurrentMonth: boolean; isToday: boolean },
    enabled: boolean,
  ): string {
    const base =
      'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors';
    if (day.key === this.selected()) {
      return `${base} bg-primary text-primary-foreground font-semibold`;
    }
    if (!enabled) {
      return `${base} text-muted-foreground/40 cursor-not-allowed`;
    }
    const month = day.inCurrentMonth ? '' : ' opacity-60';
    const todayRing = day.isToday ? ' ring-1 ring-primary/40' : '';
    return `${base} bg-muted font-medium hover:bg-accent cursor-pointer${month}${todayRing}`;
  }
}
