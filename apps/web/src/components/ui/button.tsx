import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-px',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:translate-y-px',
        secondary: 'border border-border bg-card text-foreground hover:bg-card/80 active:translate-y-px',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/20',
        outline: 'border border-border text-foreground hover:bg-background/70 active:translate-y-px',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:translate-y-px'
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
