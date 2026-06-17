import { Component, computed, input } from '@angular/core';
import { cn } from '../core/cn';

@Component({
  selector: 'app-spinner',
  template: `
    <svg
      [class]="classes()"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  `,
})
export class SpinnerComponent {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn('animate-spin text-muted-foreground', this.class()),
  );
}
