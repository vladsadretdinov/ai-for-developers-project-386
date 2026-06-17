import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../api/admin-api.service';
import type { EventType, EventTypeCreate } from '../../api/models';
import { describeApiError } from '../../core/api-error';
import {
  ButtonDirective,
  CARD,
  InputDirective,
  LabelDirective,
  SpinnerComponent,
  TextareaDirective,
} from '../../ui';

interface FormState extends EventTypeCreate {
  id: string | null;
}

@Component({
  selector: 'app-admin-event-types-page',
  imports: [
    FormsModule,
    CARD,
    ButtonDirective,
    InputDirective,
    TextareaDirective,
    LabelDirective,
    SpinnerComponent,
  ],
  template: `
    <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
      <!-- List -->
      <div>
        <h1 class="mb-4 text-xl font-bold">Типы событий</h1>
        @if (loading()) {
          <div class="flex justify-center py-16"><app-spinner class="h-6 w-6" /></div>
        } @else if (listError()) {
          <p class="text-sm text-destructive">{{ listError() }}</p>
        } @else if (eventTypes().length === 0) {
          <app-card><app-card-content class="py-10 text-center text-muted-foreground">
            Типов событий пока нет — создайте первый.
          </app-card-content></app-card>
        } @else {
          <div class="space-y-3">
            @for (et of eventTypes(); track et.id) {
              <app-card>
                <app-card-content class="flex items-start justify-between gap-4 py-4">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold">{{ et.title }}</h3>
                      <span class="text-xs text-muted-foreground">{{ et.durationMinutes }}м</span>
                    </div>
                    @if (et.description) {
                      <p class="mt-1 text-sm text-muted-foreground line-clamp-2">{{ et.description }}</p>
                    }
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button appBtn variant="outline" size="sm" (click)="edit(et)">Изменить</button>
                    <button
                      appBtn
                      variant="destructive"
                      size="sm"
                      (click)="remove(et)"
                      [disabled]="deletingId() === et.id"
                    >
                      Удалить
                    </button>
                  </div>
                </app-card-content>
              </app-card>
            }
          </div>
        }
      </div>

      <!-- Form -->
      <app-card class="h-fit lg:sticky lg:top-6">
        <app-card-header>
          <h2 appCardTitle>{{ form().id ? 'Редактировать тип' : 'Новый тип события' }}</h2>
        </app-card-header>
        <app-card-content>
          <form (ngSubmit)="save()" class="space-y-4">
            <div class="space-y-1.5">
              <label appLabel for="title">Название *</label>
              <input appInput id="title" name="title" [(ngModel)]="title" required maxlength="120" />
            </div>
            <div class="space-y-1.5">
              <label appLabel for="description">Описание</label>
              <textarea appInput id="description" name="description" rows="3" [(ngModel)]="description" maxlength="2000"></textarea>
            </div>
            <div class="space-y-1.5">
              <label appLabel for="duration">Длительность (мин) *</label>
              <input appInput id="duration" name="duration" type="number" min="1" max="1440" [(ngModel)]="durationMinutes" required />
            </div>

            @if (formError()) {
              <p class="text-sm text-destructive">{{ formError() }}</p>
            }

            <div class="flex gap-2">
              @if (form().id) {
                <button type="button" appBtn variant="outline" class="flex-1" (click)="resetForm()">Отмена</button>
              }
              <button appBtn type="submit" class="flex-1" [disabled]="saving()">
                @if (saving()) { <app-spinner class="h-4 w-4 text-primary-foreground" /> }
                Сохранить
              </button>
            </div>
          </form>
        </app-card-content>
      </app-card>
    </div>
  `,
})
export class AdminEventTypesPage {
  private readonly api = inject(AdminApiService);

  protected readonly eventTypes = signal<EventType[]>([]);
  protected readonly loading = signal(true);
  protected readonly listError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly form = signal<{ id: string | null }>({ id: null });
  protected title = '';
  protected description = '';
  protected durationMinutes: number | null = 30;
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.api.listEventTypes().subscribe({
      next: (list) => {
        this.eventTypes.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.listError.set(describeApiError(err));
        this.loading.set(false);
      },
    });
  }

  protected edit(et: EventType): void {
    this.form.set({ id: et.id });
    this.title = et.title;
    this.description = et.description;
    this.durationMinutes = et.durationMinutes;
    this.formError.set(null);
  }

  protected resetForm(): void {
    this.form.set({ id: null });
    this.title = '';
    this.description = '';
    this.durationMinutes = 30;
    this.formError.set(null);
  }

  protected save(): void {
    if (!this.title.trim() || !this.durationMinutes) {
      this.formError.set('Заполните название и длительность.');
      return;
    }
    const payload: EventTypeCreate = {
      title: this.title.trim(),
      description: this.description.trim(),
      durationMinutes: Number(this.durationMinutes),
    };
    this.saving.set(true);
    this.formError.set(null);
    const id = this.form().id;
    const req = id
      ? this.api.updateEventType(id, payload)
      : this.api.createEventType(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.resetForm();
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(describeApiError(err));
      },
    });
  }

  protected remove(et: EventType): void {
    if (!confirm(`Удалить тип события «${et.title}»?`)) return;
    this.deletingId.set(et.id);
    this.api.deleteEventType(et.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.form().id === et.id) this.resetForm();
        this.reload();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.listError.set(describeApiError(err));
      },
    });
  }
}
