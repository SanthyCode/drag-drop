import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description || !Array.isArray(body?.files)) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
