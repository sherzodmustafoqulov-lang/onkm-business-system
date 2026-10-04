import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'documents';

    if (!file) {
      return NextResponse.json({ error: 'Fayl tanlanmadi' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Format human-readable size
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const fileSize = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${sizeInKb} KB`;

    // Clean filename and make unique
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFilename = `${timestamp}_${originalName}`;

    // Target directory: public/uploads/{folder}
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${folder}/${safeFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Faylni yuklashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
