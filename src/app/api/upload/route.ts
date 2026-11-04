import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const safeExt =
      path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, '') ||
      (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const fileName = `media-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${safeExt}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json(
        {
          ok: true,
          url: `/uploads/${fileName}`,
          mimeType: file.type,
        },
        { status: 201 }
      );
    } catch {
      // Fallback for read-only serverless filesystems when Supabase is not yet connected:
      // Return a base64 Data URL for images/small clips
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
      return NextResponse.json(
        {
          ok: true,
          url: dataUrl,
          mimeType: file.type,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Falha no upload de mídia',
      },
      { status: 500 }
    );
  }
}
