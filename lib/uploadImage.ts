// lib/uploadImage.ts
import { Platform } from 'react-native';
import { supabase } from './supabase';

type Kind = 'before' | 'after';
const BUCKET = 'photos';

function extFromMime(mime: string) {
  if (!mime) return 'jpg';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic' || mime === 'image/heif') return 'jpg';
  return 'jpg';
}
function getMimeAndExt(uri: string) {
  if (uri.startsWith('data:')) {
    const m = uri.match(/^data:([^;]+);base64,/i);
    const mime = m?.[1] || 'image/jpeg';
    return { mime, ext: extFromMime(mime) };
  }
  const raw = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  let ext = raw || 'jpg';
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'heic' || ext === 'heif') ext = 'jpg';
  const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return { mime, ext };
}

export async function uploadJobPhoto({
  jobId,
  uri,
  kind,
  wantSignedUrl = false, // for previewing private buckets
}: {
  jobId: string;
  uri: string;
  kind: Kind;
  wantSignedUrl?: boolean;
}) {
  console.log('[uploadJobPhoto] START', {
    bucket: BUCKET, jobId, kind, platform: Platform.OS,
    uri: uri.slice(0, 64) + (uri.length > 64 ? '…' : '')
  });

  const { mime, ext } = getMimeAndExt(uri);
  console.log('[uploadJobPhoto] mime/ext', { mime, ext });

  // Fetch bytes
  const resp = await fetch(uri);
  console.log('[uploadJobPhoto] fetch status', resp.status, resp.statusText);
  if (!resp.ok) throw new Error(`Failed to read image (${resp.status})`);

  let blob: Blob;
  if (Platform.OS === 'web') {
    const buf = await resp.arrayBuffer();
    console.log('[uploadJobPhoto] size(bytes)', buf.byteLength);
    blob = new Blob([buf], { type: mime });
  } else {
    // @ts-ignore - RN fetch has blob()
    blob = await resp.blob();
    // @ts-ignore
    console.log('[uploadJobPhoto] RN blob size', blob?.size ?? 'unknown');
  }

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeJob = String(jobId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const path = `/${safeJob}/${kind}-${unique}.${ext}`;
  console.log('[uploadJobPhoto] path', path);

  // --- Guard: ensure bucket exists in THIS project
  try {
    const probe = await supabase.storage.from(BUCKET).list('', { limit: 1 });
    if (probe.error && String(probe.error.message).includes('Bucket not found')) {
      throw new Error(`Storage bucket "${BUCKET}" not found in this Supabase project`);
    }
  } catch (e) {
    console.error('[uploadJobPhoto] bucket probe failed', e);
    throw e;
  }

  // ---------- Plan A: Signed Upload (most robust on web) ----------
  console.log('[uploadJobPhoto] createSignedUploadUrl…');
  const { data: signed, error: signErr } = await supabase
    .storage.from(BUCKET)
    .createSignedUploadUrl(path);
  console.log('[uploadJobPhoto] signed', signed, 'signErr', signErr);
  if (signErr || !signed?.token) {
    console.warn('[uploadJobPhoto] signed upload unavailable, falling back to direct upload…');
    // ---------- Plan B: Direct upload fallback ----------
    const { data: upData, error: upErr } = await supabase
      .storage.from(BUCKET)
      .upload(path, blob, { contentType: mime, upsert: true });
    console.log('[uploadJobPhoto] direct upload data', upData, 'err', upErr);
    if (upErr) throw upErr;
  } else {
    const { data: up2, error: up2Err } = await supabase
      .storage.from(BUCKET)
      .uploadToSignedUrl(path, signed.token, blob, { contentType: mime });
    console.log('[uploadJobPhoto] signed upload result', up2, 'err', up2Err);
    if (up2Err) throw up2Err;
  }

  // Get preview URL
  let renderUrl: string;
  if (wantSignedUrl) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw error || new Error('Signed URL failed');
    renderUrl = data.signedUrl;
  } else {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    renderUrl = data.publicUrl;
  }
  console.log('[uploadJobPhoto] renderUrl', renderUrl?.slice(0, 80) + '…');

  // Insert DB row
  const { data: row, error: insErr } = await supabase
    .from('photos')
    .insert({ job_id: jobId, type: kind, image_url: path })
    .select()
    .single();

  console.log('[uploadJobPhoto] DB row', row, 'insErr', insErr);
  if (insErr) throw insErr;

  console.log('[uploadJobPhoto] SUCCESS', { path });
  return { path, renderUrl, row };
}
