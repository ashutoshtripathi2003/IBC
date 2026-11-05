import { currentSession } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return currentSession(request);
}
