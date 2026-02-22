import { NextResponse } from 'next/server';
import { seedIfEmpty } from '@/lib/seed-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleSeed() {
  try {
    const seeded = await seedIfEmpty();
    return NextResponse.json({ seeded });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error), stack: error?.stack },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}
