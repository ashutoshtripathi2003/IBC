import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxy(request, {
    method: 'POST',
    path: '/auth/register',
    auth: false,
    body: true,
    session: 'issue',
  });
}
