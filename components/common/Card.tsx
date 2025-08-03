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
  variant = 'glass' 
}: CardProps) {
  const paddingSizes = {
    sm: 'p-5',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    glass: 'glass-card fade-in',
  };

  return (
    <div
      className={classNames(
        'rounded-3xl',
        variants[variant],
        paddingSizes[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
