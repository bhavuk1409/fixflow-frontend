import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:8000';

async function proxy(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('path') || '';
  if (!url.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const target = `${BACKEND_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;

  try {
    const { getToken } = await auth();
    const clerkToken = await getToken();
    const incomingAuth = req.headers.get('authorization');

    const upstreamHeaders: Record<string, string> = {};
    if (incomingAuth) {
      upstreamHeaders.Authorization = incomingAuth;
    } else if (clerkToken) {
      upstreamHeaders.Authorization = `Bearer ${clerkToken}`;
    }

    const init: RequestInit = {
      method: req.method,
      headers: upstreamHeaders,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      init.body = body;
      upstreamHeaders['Content-Type'] = req.headers.get('content-type') || 'application/json';
    }

    const res = await fetch(target, init);
    const contentType = res.headers.get('content-type') || '';
    const headers = new Headers();
    const contentDisposition = res.headers.get('content-disposition');
    const cacheControl = res.headers.get('cache-control');
    const location = res.headers.get('location');
    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (cacheControl) headers.set('Cache-Control', cacheControl);
    if (location) headers.set('Location', location);

    // Preserve streaming for SSE chat responses.
    if (contentType.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // 204/205/304 and HEAD responses must not carry a response body.
    if (req.method === 'HEAD' || res.status === 204 || res.status === 205 || res.status === 304) {
      return new NextResponse(null, { status: res.status, headers });
    }

    // Stream backend response through as-is (works for JSON, text, and binary/PDF).
    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: 'Proxy failed to reach backend' }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

export async function PUT(req: NextRequest) {
  return proxy(req);
}

export async function PATCH(req: NextRequest) {
  return proxy(req);
}

export async function DELETE(req: NextRequest) {
  return proxy(req);
}
