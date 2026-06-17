import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../api/public-api.service';
import { AdminApiService } from '../../api/admin-api.service';
import type { EventType, Owner } from '../../api/models';
import { describeApiError } from '../../core/api-error';
import { CARD, ButtonDirective, SpinnerComponent } from '../../ui';

@Component({
  selector: 'app-event-types-page',
  imports: [RouterLink, CARD, ButtonDirective, SpinnerComponent],
  template: `
    <div class="mx-auto max-w-4xl px-4 py-10">
      <header class="mb-8 flex items-center gap-4">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary"
        >
          {{ ownerInitial() }}
        </div>
        <div>
          <p class="text-sm text-muted-foreground">
            {{ owner()?.name ?? 'Владелец календаря' }}
          </p>
          <h1 class="text-2xl font-bold tracking-tight">Выберите тип встречи</h1>
        </div>
      </header>

      @if (loading()) {
        <div class="flex justify-center py-16"><app-spinner class="h-6 w-6" /></div>
      } @else if (error()) {
        <app-card class="border-destructive/40">
          <app-card-content class="py-6 text-sm text-destructive">{{ error() }}</app-card-content>
        </app-card>
      } @else if (eventTypes().length === 0) {
        <app-card>
          <app-card-content class="py-12 text-center text-muted-foreground">
            Пока нет доступных типов встреч.
          </app-card-content>
        </app-card>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (et of eventTypes(); track et.id) {
            <app-card class="flex flex-col transition-shadow hover:shadow-md">
              <app-card-header>
                <div class="flex items-center justify-between">
                  <h3 appCardTitle class="text-lg">{{ et.title }}</h3>
                  <span class="flex items-center gap-1 text-sm text-muted-foreground">
                    🕒 {{ et.durationMinutes }}м
                  </span>
                </div>
                @if (et.description) {
                  <p appCardDescription class="line-clamp-2">{{ et.description }}</p>
                }
              </app-card-header>
              <app-card-footer class="mt-auto">
                <a appBtn [routerLink]="['/book', et.id]" class="w-full">Записаться</a>
              </app-card-footer>
            </app-card>
          }
        </div>
      }
    </div>
  `,
})
export class EventTypesPage {
  private readonly api = inject(PublicApiService);
  private readonly adminApi = inject(AdminApiService);

  protected readonly eventTypes = signal<EventType[]>([]);
  protected readonly owner = signal<Owner | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.listEventTypes().subscribe({
      next: (list) => {
        this.eventTypes.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(describeApiError(err));
        this.loading.set(false);
      },
    });
    // Owner profile is informational; ignore failures.
    this.adminApi.getOwner().subscribe({
      next: (o) => this.owner.set(o),
      error: () => {},
    });
  }

  protected ownerInitial(): string {
    return (this.owner()?.name ?? 'B').trim().charAt(0).toUpperCase();
  }
}
