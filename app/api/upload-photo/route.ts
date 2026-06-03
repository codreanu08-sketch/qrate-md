import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_MAGIC: number[][] = [
  [0xFF, 0xD8, 0xFF],        // JPEG
  [0x89, 0x50, 0x4E, 0x47], // PNG
  [0x47, 0x49, 0x46],        // GIF
  [0x52, 0x49, 0x46, 0x46], // WebP (RIFF header)
];

function hasValidMagicBytes(buffer: Uint8Array): boolean {
  return ALLOWED_MAGIC.some(magic => magic.every((byte, i) => buffer[i] === byte));
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const slug = formData.get('slug') as string | null;

  if (!file || !slug) {
    return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!hasValidMagicBytes(buffer)) {
    return NextResponse.json({ error: 'Invalid file content' }, { status: 400 });
  }

  const safeSlug = slug.replace(/[^\w\-]/g, '');
  const fileName = `${safeSlug}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('review-photos')
    .upload(fileName, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from('review-photos').getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
