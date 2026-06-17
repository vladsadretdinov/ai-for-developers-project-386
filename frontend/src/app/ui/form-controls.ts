import { computed, Directive, input } from '@angular/core';
import { cn } from '../core/cn';

@Directive({
  selector: 'input[appInput]',
  host: { '[class]': 'classes()' },
})
export class InputDirective {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
      this.class(),
    ),
  );
}

@Directive({
  selector: 'textarea[appInput]',
  host: { '[class]': 'classes()' },
})
export class TextareaDirective {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
      this.class(),
    ),
  );
}

@Directive({
  selector: 'label[appLabel]',
  host: { '[class]': 'classes()' },
})
export class LabelDirective {
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn('text-sm font-medium leading-none', this.class()),
  );
}
