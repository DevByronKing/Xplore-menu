import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { generateUUID } from '@/lib/utils';

export const SUPABASE_MEDIA_BUCKET = 'menu-media';

/**
 * Automatically captures a JPEG poster frame from a video File selected from the phone's gallery
 */
export function extractVideoPosterFrame(file: File): Promise<string | null> {
  if (typeof window === 'undefined' || !file.type.startsWith('video/')) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.8, (video.duration || 2) * 0.25);
    };

    video.onseeked = () => {
      try {
        window.clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        const targetW = 540;
        const targetH =
          video.videoWidth > 0
            ? Math.round((video.videoHeight / video.videoWidth) * targetW)
            : 960;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch {
        // Ignore canvas errors
      }
      cleanup();
      resolve(null);
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(null);
    };
  });
}

/**
 * Uploads a video or image file selected from the owner's mobile gallery:
 * 1. Primary: Supabase Storage bucket `menu-media` (when configured)
 * 2. Fallback: Local Next.js `/api/upload` endpoint (`public/uploads/...`)
 */
export async function uploadMediaFromGallery(
  file: File
): Promise<{
  mediaUrl: string;
  mediaType: 'video' | 'image';
  posterUrl?: string;
}> {
  const isVideo = file.type.startsWith('video/');
  const mediaType: 'video' | 'image' = isVideo ? 'video' : 'image';

  // Extract automatic thumbnail poster if it's a video from the phone gallery
  const extractedPoster = isVideo ? await extractVideoPosterFrame(file) : null;

  // 1. Try Supabase Storage first if configured
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const storagePath = `dishes/${Date.now()}-${generateUUID().slice(0, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (!error) {
      const { data } = supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .getPublicUrl(storagePath);

      return {
        mediaUrl: data.publicUrl,
        mediaType,
        posterUrl: extractedPoster || undefined,
      };
    }
  }

  // 2. Fallback to Next.js /api/upload route
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const result = (await response.json()) as { url?: string };
    if (result.url) {
      return {
        mediaUrl: result.url,
        mediaType,
        posterUrl: extractedPoster || undefined,
      };
    }
  }

  // 3. Last-resort client ObjectURL
  const localBlobUrl = URL.createObjectURL(file);
  return {
    mediaUrl: localBlobUrl,
    mediaType,
    posterUrl: extractedPoster || undefined,
  };
}
