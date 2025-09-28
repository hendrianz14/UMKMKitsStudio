import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

function cn(...values: Array<string | undefined | false | null>) {
  return twMerge(values.filter(Boolean));
}

const cardVariants = cva(
  'relative rounded-2xl border transition-shadow duration-200',
  {
    variants: {
      tone: {
        surface: 'bg-card border-border shadow-[0_10px_30px_-12px_rgba(0,0,0,.45)]',
        glass: 'bg-white/5 border-white/10 backdrop-blur-md shadow-[0_10px_30px_-12px_rgba(0,0,0,.45)]',
        subtle: 'bg-background/40 border-border'
      },
      padding: { none: 'p-0', sm: 'p-4', md: 'p-6', lg: 'p-8' },
      interactive: { true: 'hover:shadow-lg hover:shadow-black/30', false: '' },
      emphasis: { default: '', featured: 'ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--ring)/.25)]' }
    },
    defaultVariants: { tone: 'surface', padding: 'md', interactive: false, emphasis: 'default' }
  }
);

export interface CardXProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function CardX({ className, tone, padding, interactive, emphasis, ...props }: CardXProps) {
  return (
    <div className={cn(cardVariants({ tone, padding, interactive, emphasis }), className)} {...props} />
  );
}

export function CardXHeader({
  title,
  subtitle
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {title ? <h3 className="text-xl font-semibold text-foreground">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function CardXFooter({ children }: { children?: React.ReactNode }) {
  return <div className="mt-6 flex items-center gap-3">{children}</div>;
}
