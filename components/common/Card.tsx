import { ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass';
}

export function Card({
  children,
  className,
  padding = 'md',
  variant = 'glass',
}: CardProps) {
  const paddingSizes = {
    sm: 'p-6',
    md: 'p-8',
    lg: 'p-10',
  };

  const variants = {
    default:
      'bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300',
    glass: 'glass-card fade-in hover:shadow-2xl transition-all duration-300',
  };

  return (
    <div
      className={classNames(
        'rounded-3xl relative overflow-hidden',
        variants[variant],
        paddingSizes[padding],
        className
      )}
    >
      {/* Subtle gradient overlay for glass variant */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-orange-50/30 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
