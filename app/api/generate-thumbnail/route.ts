import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Generates a YouTube thumbnail with Gemini's Nano Banana Pro model
 * (gemini-3-pro-image-preview) via the Interactions API, then stores it in
 * the user's `thumbnails` Supabase Storage folder and records it in the
 * `thumbnails` table so it shows up in their gallery across devices.
 * Requires GEMINI_API_KEY in the environment.
 *
 * The caller is still identified via their own session (below) — only the
 * storage/table writes go through the service-role client, which bypasses
 * RLS. Never derive `user.id` from anything other than the authenticated
 * session here, since nothing else double-checks ownership past this point.
 */

const GEMINI_MODEL = 'gemini-3-pro-image-preview';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const THUMBNAILS_BUCKET = 'thumbnails';
const MAX_REFERENCE_IMAGES = 10;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type GenerateRequestBody = {
  prompt?: string;
  referenceImages?: { data: string; mimeType: string }[] | null;
};

type InteractionContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClient();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: GenerateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
  }

  const referenceImages = Array.isArray(body.referenceImages) ? body.referenceImages : [];
  if (referenceImages.length > MAX_REFERENCE_IMAGES) {
    return NextResponse.json(
      { error: `최대 ${MAX_REFERENCE_IMAGES}개의 참조 이미지만 첨부할 수 있습니다.` },
      { status: 400 }
    );
  }
  for (const ref of referenceImages) {
    const approxBytes = ((ref?.data?.length ?? 0) * 3) / 4;
    if (approxBytes > MAX_REFERENCE_IMAGE_BYTES) {
      return NextResponse.json(
        { error: '각 참조 이미지는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }
  }

  const input: InteractionContentBlock[] = [{ type: 'text', text: prompt }];
  for (const ref of referenceImages) {
    if (ref?.data && ref.mimeType) {
      input.push({ type: 'image', data: ref.data, mime_type: ref.mimeType });
    }
  }

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(GEMINI_INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input,
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '16:9',
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the Gemini API.' },
      { status: 502 }
    );
  }

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    return NextResponse.json(
      { error: `Gemini API error (${geminiResponse.status}): ${errorText}` },
      { status: 502 }
    );
  }

  const interaction = await geminiResponse.json();
  const outputImage = interaction.output_image;

  if (!outputImage?.data) {
    return NextResponse.json(
      { error: 'Gemini did not return an image.' },
      { status: 502 }
    );
  }

  const mimeType = outputImage.mime_type ?? 'image/jpeg';
  const extension = EXTENSION_BY_MIME[mimeType] ?? 'jpg';
  const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const imageBuffer = Buffer.from(outputImage.data, 'base64');

  const { error: uploadError } = await admin.storage
    .from(THUMBNAILS_BUCKET)
    .upload(imagePath, imageBuffer, { contentType: mimeType });

  if (uploadError) {
    return NextResponse.json(
      { error: `Failed to store the generated thumbnail: ${uploadError.message}` },
      { status: 502 }
    );
  }

  const { data: thumbnail, error: insertError } = await admin
    .from('thumbnails')
    .insert({ user_id: user.id, prompt, image_path: imagePath, status: 'completed' })
    .select('id, prompt, image_path, created_at')
    .single();

  if (insertError || !thumbnail) {
    await admin.storage.from(THUMBNAILS_BUCKET).remove([imagePath]);
    return NextResponse.json(
      { error: `Failed to save the thumbnail record: ${insertError?.message ?? 'unknown error'}` },
      { status: 502 }
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(THUMBNAILS_BUCKET).getPublicUrl(thumbnail.image_path as string);

  return NextResponse.json({
    id: thumbnail.id,
    prompt: thumbnail.prompt,
    image: publicUrl,
    createdAt: thumbnail.created_at,
  });
}
