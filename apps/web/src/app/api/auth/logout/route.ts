import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxy(request, {
    method: 'POST',
    path: '/auth/logout',
    auth: true,
    body: false,
    session: 'end',
  });
}
