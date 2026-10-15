import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { animate } from 'framer-motion';

export function Panel({
  title,
  right,
  children,
  className = '',
  bodyClass = 'p-3',
  tone,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
  tone?: 'crimson' | 'gold';
}) {
  const border = tone === 'crimson' ? '!border-crimson' : tone === 'gold' ? '!border-gold' : '';
  return (
    <section className={`panel ${border} ${className}`}>
      <span className="xh -left-[4px] -top-[7px]">+</span>
      <span className="xh -right-[4px] -top-[7px]">+</span>
      <span className="xh -bottom-[7px] -left-[4px]">+</span>
      <span className="xh -bottom-[7px] -right-[4px]">+</span>
      {title != null && (
        <header className="panel-head">
          <h2 className="label !text-ivory/80">{title}</h2>
          {right}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** Number that tweens smoothly; tabular-nums so it never jitters. */
export function AnimatedNumber({
  value,
  decimals = 1,
  suffix = '',
  className = '',
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

  useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt(prev.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, suffix]);

  return <span ref={ref} className={`tabular ${className}`} />;
}

export function Sparkline({
  data,
  color,
  width = 84,
  height = 22,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = pts.split(' ').pop()!.split(',');
  return (
    <svg width={width} height={height} className="block" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
      <rect x={Number(last[0]) - 1.5} y={Number(last[1]) - 1.5} width="3" height="3" fill={color} />
    </svg>
  );
}

export function Led({ gold = false, off = false }: { gold?: boolean; off?: boolean }) {
  if (off) return <span className="inline-block h-[7px] w-[7px] rounded-full bg-crimson" />;
  return <span className={`led ${gold ? 'led-gold' : ''}`} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
      <div>
        <p className="label !text-gold">{kicker}</p>
        <h1 className="mt-1 text-3xl font-medium leading-none text-ivory md:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export const fmtSecondsLabel = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? (r ? `${m}m ${r}s` : `${m}m`) : `${r}s`;
};
