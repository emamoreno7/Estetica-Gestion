import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline';
  external?: boolean;
  className?: string;
};

export function AmoreLink({ href, children, variant = 'primary', external = false, className = '' }: Props) {
  return (
    <a
      className={['amore-link', 'amore-link--' + variant, className].filter(Boolean).join(' ')}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
      <ArrowUpRight size={16} strokeWidth={1.7} aria-hidden="true" />
    </a>
  );
}
