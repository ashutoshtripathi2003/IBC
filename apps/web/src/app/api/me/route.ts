import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return proxy(request, { method: 'GET', path: '/me', auth: true, body: false });
}

export function PATCH(request: Request) {
  return proxy(request, { method: 'PATCH', path: '/me', auth: true, body: true });
}
