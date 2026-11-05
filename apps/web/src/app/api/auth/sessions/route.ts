import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return proxy(request, { method: 'GET', path: '/auth/sessions', auth: true, body: false });
}
