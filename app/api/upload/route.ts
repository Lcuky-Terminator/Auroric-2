import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { storage, BUCKET_ID } from '@/lib/appwrite';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    const fileId = ID.unique();
    const uploaded = await storage.createFile(
      BUCKET_ID,
      fileId,
      file,
    );

    // Build the public preview URL
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_PROJECT_ID || '';
    const url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${projectId}`;

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('Upload failed:', err.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
