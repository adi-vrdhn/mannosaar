import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSameOrigin } from '@/lib/compliance';
import { allowRequest } from '@/lib/compliance-server';
import { check, db } from '@/lib/whatsapp/server';
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid file data');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  return { buffer, mimeType };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const actor = await db().from('users').select('role').eq('id', session.user.id).maybeSingle();
    check(actor.error);
    if (!['admin', 'therapist'].includes(actor.data?.role || '')) return new Response('Forbidden', { status: 403 });
    if (!isSameOrigin(request)) return new Response('Forbidden', { status: 403 });
    if (!(await allowRequest('content-upload', session.user.id, 20, 3600))) return new Response('Too many uploads', { status: 429 });
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > 52 * 1024 * 1024) return new Response('File too large', { status: 413 });
    if (!CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name is not configured' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let file: string | File | null = null;
    let resourceType = 'image';
    let folder = 'mental-health/images';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      file = formData.get('file') as File | string | null;
      resourceType = String(formData.get('resourceType') || 'image');
      folder = String(formData.get('folder') || folder);
    } else {
      const body = await request.json();
      file = body.file || body.image || null;
      resourceType = body.resourceType || 'image';
      folder = body.folder || folder;
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    const allowedFolders = new Set(['mental-health/images', 'mental-health/blog-covers', 'mental-health/videos']);
    if (!['image', 'video'].includes(resourceType) || !allowedFolders.has(folder) || (resourceType === 'video') !== (folder === 'mental-health/videos')) {
      return NextResponse.json({ error: 'Invalid upload destination' }, { status: 400 });
    }
    const maxBytes = resourceType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (typeof file === 'string' && file.length > Math.ceil(maxBytes * 4 / 3) + 100) return new Response('File too large', { status: 413 });
    if (file instanceof File && file.size > maxBytes) return new Response('File too large', { status: 413 });

    const uploadBody = new FormData();
    uploadBody.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    uploadBody.append('folder', folder);

    if (typeof file === 'string') {
      const { buffer, mimeType } = dataUrlToBuffer(file);
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mimeType) || buffer.length > maxBytes || resourceType !== 'image') return new Response('Unsupported file', { status: 400 });
      uploadBody.append(
        'file',
        new Blob([buffer], { type: mimeType }),
        `upload.${mimeType.split('/')[1] || 'bin'}`
      );
    } else {
      const allowedMime = resourceType === 'video' ? ['video/mp4', 'video/webm', 'video/quicktime'] : ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (!allowedMime.includes(file.type)) return new Response('Unsupported file', { status: 400 });
      uploadBody.append('file', file);
    }

    const result = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: uploadBody,
      }
    );

    const responseData = await result.json();

    if (!result.ok) {
      console.error('Cloudinary upload failed:', responseData);
      return NextResponse.json(
        { error: responseData.error?.message || 'Failed to upload file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: responseData.secure_url,
      publicId: responseData.public_id,
      duration: responseData.duration,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
