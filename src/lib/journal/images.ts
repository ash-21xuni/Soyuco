"use client";

import { supabase } from "@/lib/supabase/client";

// Journal images live in a private bucket (see supabase/sql/journal_images.sql).
// Entries store only the storage path; a fresh signed link is fetched to show
// each image, so links never need to be public or long-lived.

export const JOURNAL_IMAGE_BUCKET = "journal-images";
export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const LINK_SECONDS = 60 * 60;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function uploadJournalImage(
  file: File,
  userId: string,
): Promise<{ path: string } | { error: string }> {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    return { error: "Only PNG, JPEG, GIF and WebP images can be added." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Images must be 10 MB or smaller." };
  }
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage
    .from(JOURNAL_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600" });
  return error ? { error: error.message } : { path };
}

const cache = new Map<string, { url: string; expires: number }>();
const pending = new Map<string, Promise<string | null>>();

/** A signed link for `path`, reused until shortly before it expires. */
export function signedImageUrl(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now() + 60_000) return Promise.resolve(hit.url);
  const inFlight = pending.get(path);
  if (inFlight) return inFlight;

  const request = supabase.storage
    .from(JOURNAL_IMAGE_BUCKET)
    .createSignedUrl(path, LINK_SECONDS)
    .then(({ data, error }) => {
      pending.delete(path);
      if (error || !data) return null;
      cache.set(path, { url: data.signedUrl, expires: Date.now() + LINK_SECONDS * 1000 });
      return data.signedUrl;
    });
  pending.set(path, request);
  return request;
}
