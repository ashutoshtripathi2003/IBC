import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxy(request, {
    method: 'POST',
    path: '/auth/login',
    auth: false,
    body: true,
    session: 'issue',
  });
}
