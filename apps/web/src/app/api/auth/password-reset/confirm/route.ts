import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

// The API signs out every session after a reset, so this browser's cookie is cleared too.
export function POST(request: Request) {
  return proxy(request, {
    method: 'POST',
    path: '/auth/password-reset/confirm',
    auth: false,
    body: true,
    session: 'ended-on-success',
  });
}
