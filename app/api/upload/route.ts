import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: "Nama file tidak ditemukan." }, { status: 400 });
  }
  
  const blob = await put(filename, request.body, { access: 'public' });

  return NextResponse.json(blob);
}