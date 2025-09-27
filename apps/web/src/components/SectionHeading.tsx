import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, description, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={cn('mx-auto max-w-2xl space-y-4', align === 'center' ? 'text-center' : 'text-left')}
      data-animate="fade-up"
    >
      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {description ? <p className="text-base text-[var(--text-muted)]">{description}</p> : null}
    </div>
  );
}
