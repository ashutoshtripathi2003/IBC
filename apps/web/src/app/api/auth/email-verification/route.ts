import { proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxy(request, {
    method: 'POST',
    path: '/auth/email-verification',
    auth: true,
    body: false,
  });
}
