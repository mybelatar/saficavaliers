import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploaded = formData.get('file');

    if (!(uploaded instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!uploaded.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (uploaded.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Image exceeds max size of 5 MB' },
        { status: 400 }
      );
    }

    const extension = extensionByMimeType[uploaded.type] ?? 'jpg';
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'menu');
    const outputPath = path.join(uploadsDir, filename);

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(outputPath, Buffer.from(await uploaded.arrayBuffer()));

    return NextResponse.json({
      url: `/uploads/menu/${filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
