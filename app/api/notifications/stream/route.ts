import { NextRequest, NextResponse } from 'next/server';
import { notificationHub, type AppNotification } from '../../../../lib/notifications';
import { isUserRole } from '../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const roleParam = new URL(request.url).searchParams.get('role');

  if (!isUserRole(roleParam)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let isClosed = false;

  const send = (controller: ReadableStreamDefaultController, notification: AppNotification) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(notification)}\n\n`));
  };

  const closeStream = (controller: ReadableStreamDefaultController) => {
    if (isClosed) {
      return;
    }

    isClosed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    controller.close();
  };

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: ready\ndata: ${JSON.stringify({
            connected: true,
            role: roleParam,
            at: new Date().toISOString()
          })}\n\n`
        )
      );

      unsubscribe = notificationHub.subscribe(roleParam, (notification) => {
        send(controller, notification);
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 20000);

      request.signal.addEventListener('abort', () => {
        closeStream(controller);
      });
    },
    cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
