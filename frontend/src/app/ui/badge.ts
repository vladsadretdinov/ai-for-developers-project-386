import { computed, Directive, input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../core/cn';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success/15 text-success',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

@Directive({
  selector: '[appBadge]',
  host: { '[class]': 'classes()' },
})
export class BadgeDirective {
  readonly variant = input<BadgeVariant>('default');
  readonly class = input<string>('');
  protected readonly classes = computed(() =>
    cn(badgeVariants({ variant: this.variant() }), this.class()),
  );
}
