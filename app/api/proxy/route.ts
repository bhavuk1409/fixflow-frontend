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

    const headers: Record<string, string> = {};
    if (incomingAuth) {
      headers.Authorization = incomingAuth;
    } else if (clerkToken) {
      headers.Authorization = `Bearer ${clerkToken}`;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      init.body = body;
      headers['Content-Type'] = req.headers.get('content-type') || 'application/json';
    }

    const res = await fetch(target, init);
    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
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

export async function DELETE(req: NextRequest) {
  return proxy(req);
}
