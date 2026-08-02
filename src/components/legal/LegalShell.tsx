import type { ReactNode } from 'react';
import { NewsShell } from '@/components/news/NewsShell';

interface LegalShellProps {
  children: ReactNode;
}

export function LegalShell({ children }: LegalShellProps) {
  return (
    <NewsShell>
      <div className="legal-page">{children}</div>
    </NewsShell>
  );
}
