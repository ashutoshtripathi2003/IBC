import { problem } from '@/server/http';
import { isUuid, proxy } from '@/server/proxy';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!isUuid(sessionId)) return problem(404, 'not_found', 'Session not found.');
  return proxy(request, {
    method: 'DELETE',
    path: `/auth/sessions/${sessionId}`,
    auth: true,
    body: false,
  });
}
