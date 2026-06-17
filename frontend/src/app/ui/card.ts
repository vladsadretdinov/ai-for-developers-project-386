import { Component, computed, Directive, input } from '@angular/core';
import { cn } from '../core/cn';

@Component({
  selector: 'app-card',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class CardComponent {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn('rounded-xl border bg-card text-card-foreground shadow-sm', this.class()),
  );
}

@Component({
  selector: 'app-card-header',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class CardHeaderComponent {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn('flex flex-col gap-1.5 p-6', this.class()),
  );
}

@Directive({ selector: '[appCardTitle]', host: { class: 'font-semibold leading-none tracking-tight' } })
export class CardTitleDirective {}

@Directive({ selector: '[appCardDescription]', host: { class: 'text-sm text-muted-foreground' } })
export class CardDescriptionDirective {}

@Component({
  selector: 'app-card-content',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class CardContentComponent {
  readonly class = input<string>('');
  protected readonly classes = computed(() => cn('p-6 pt-0', this.class()));
}

@Component({
  selector: 'app-card-footer',
  template: '<ng-content />',
  host: { '[class]': 'classes()' },
})
export class CardFooterComponent {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn('flex items-center p-6 pt-0', this.class()),
  );
}

export const CARD = [
  CardComponent,
  CardHeaderComponent,
  CardTitleDirective,
  CardDescriptionDirective,
  CardContentComponent,
  CardFooterComponent,
] as const;
