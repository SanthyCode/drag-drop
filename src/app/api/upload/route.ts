import { NextResponse } from 'next/server';

export async function POST() {
  // Simulación ok
  const id = crypto.randomUUID();
  return NextResponse.json({ id, url: `/api/assets/${id}.pdf` }, { status: 200 });
}
