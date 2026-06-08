import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function GlassCard({ children, className = '', padding = 'lg' }: GlassCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-[21px]',
    md: 'p-[25px]',
    lg: 'p-[33px]',
  };

  return (
    <div
      className={`backdrop-blur-[24px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.2)] rounded-[24px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
