import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-accent text-white shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-blue-600/40 active:translate-y-0 focus-visible:ring-primary/70',
        primary:
          'bg-gradient-accent text-white shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-blue-600/40 active:translate-y-0 focus-visible:ring-primary/70',
        secondary:
          'bg-surface/80 text-text hover:bg-surface/60 border border-white/10 shadow-subtle hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-primary/70',
        ghost:
          'bg-transparent text-text hover:bg-white/5 focus-visible:ring-primary/60',
        outline:
          'border border-white/20 bg-transparent text-text hover:bg-white/10 focus-visible:ring-primary/60',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400/80'
      },
      size: {
        default: 'h-11 px-6 py-2 gap-2',
        lg: 'h-12 px-7 text-base gap-3',
        sm: 'h-9 px-4 text-sm gap-2',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref as never}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
