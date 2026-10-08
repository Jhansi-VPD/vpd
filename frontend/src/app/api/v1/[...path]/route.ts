import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_PROXY_TARGET || 'http://127.0.0.1:8000';

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params?.path || []).join('/');
  const search = request.nextUrl.search || '';
  const targetUrl = `${BACKEND_URL}/api/v1/${path}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Skip hop-by-hop headers
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = await request.blob();
    }

    const res = await fetch(targetUrl, fetchOptions);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, {
        status: res.status,
      });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (err: any) {
    // If backend is temporarily unreachable, return graceful JSON rather than crashing
    return NextResponse.json(
      {
        success: false,
        status_code: 502,
        message: 'Backend proxy error: ' + (err?.message || 'Connection failed'),
        data: null,
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
