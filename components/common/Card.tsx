import { ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingSizes = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={classNames(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        paddingSizes[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
