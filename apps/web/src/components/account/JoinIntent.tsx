'use client';

import { useSearchParams } from 'next/navigation';
import { companyBySlug, personBySlug, productBySlug } from '@/content/catalog';

/** Explains what the visitor was trying to do when a members-only action sent them here. */
export function JoinIntent() {
  const params = useSearchParams();
  const intent = params.get('intent');
  const product = productBySlug(params.get('product') ?? '');
  const company = companyBySlug(params.get('company') ?? '');
  const person = personBySlug(params.get('person') ?? '');
  let message: string | null = null;
  if (intent === 'rfq')
    message = `Requesting a quotation${product ? ` for ${product.name}` : company ? ` from ${company.name}` : ''} needs an IBC account.`;
  if (intent === 'connect')
    message = `Connecting with ${person?.name ?? company?.name ?? 'members'} needs an IBC account.`;
  if (intent === 'message')
    message = `Messaging ${person?.name ?? 'members'} needs an IBC account.`;
  if (intent === 'respond') message = 'Responding to opportunities needs an IBC account.';
  if (!message) return null;
  return (
    <p
      role="status"
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderLeft: '3px solid var(--gold-500)',
        background: 'var(--gold-100)',
        color: 'var(--navy-900)',
        fontSize: 'var(--text-sm)',
      }}
    >
      {message}
    </p>
  );
}
