import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassSurface({
  children,
  className,
  intensity = 'medium',
  border = true,
  hover = false,
  onClick,
}: GlassSurfaceProps) {
  const intensityClasses = {
    light: 'backdrop-blur-sm bg-white/3',
    medium: 'backdrop-blur-glass bg-white/5',
    heavy: 'backdrop-blur-glass-heavy bg-white/8',
  };

  const borderClasses = border
    ? 'border border-white/10'
    : 'border-transparent';

  const hoverClasses = hover
    ? 'transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]'
    : '';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl',
        intensityClasses[intensity],
        borderClasses,
        hoverClasses,
        'bg-gradient-to-br from-white/5 to-transparent',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassCardProps extends GlassSurfaceProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function GlassCard({
  children,
  title,
  subtitle,
  icon,
  className,
  intensity = 'medium',
  border = true,
  hover = false,
  onClick,
}: GlassCardProps) {
  return (
    <GlassSurface
      className={clsx('p-6', className)}
      intensity={intensity}
      border={border}
      hover={hover}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-soft-white tracking-wider uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-muted-silver mt-1">{subtitle}</p>
            )}
          </div>
          {icon && <div className="text-electric-cyan">{icon}</div>}
        </div>
      )}
      {children}
    </GlassSurface>
  );
}

interface GlassMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GlassMetric({
  label,
  value,
  unit,
  trend,
  trendValue,
  size = 'md',
}: GlassMetricProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const trendColor = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-muted-silver',
  };

  return (
    <GlassSurface className={clsx(sizeClasses[size], 'text-center')}>
      <div className="section-label mb-3">{label}</div>
      <div className={clsx('font-mono font-bold text-soft-white', valueSizeClasses[size])}>
        {value}
        {unit && <span className="text-muted-silver text-lg ml-1">{unit}</span>}
      </div>
      {trend && trendValue && (
        <div className={clsx('text-xs font-semibold mt-2', trendColor[trend])}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
        </div>
      )}
    </GlassSurface>
  );
}