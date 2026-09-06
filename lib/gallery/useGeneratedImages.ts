'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
};

const THUMBNAILS_BUCKET = 'thumbnails';
const MAX_FETCHED_IMAGES = 60;

/**
 * Reads a user's generated thumbnails from Supabase (the `thumbnails` table
 * + `thumbnails` storage bucket, both scoped to the signed-in user by RLS)
 * and exposes an `addImage` to optimistically prepend one the API route just
 * created, without waiting on a refetch.
 */
export function useGeneratedImages(userId: string | null) {
  const [images, setImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const supabase = createClient();

    supabase
      .from('thumbnails')
      .select('id, prompt, image_path, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(MAX_FETCHED_IMAGES)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setImages(
          data
            .filter((row) => Boolean(row.image_path))
            .map((row) => ({
              id: row.id as string,
              prompt: row.prompt as string,
              url: supabase.storage.from(THUMBNAILS_BUCKET).getPublicUrl(row.image_path as string).data
                .publicUrl,
              createdAt: new Date(row.created_at as string).getTime(),
            }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addImage = useCallback((image: GeneratedImage) => {
    setImages((prev) => [image, ...prev]);
  }, []);

  return { images: userId ? images : [], addImage };
}
