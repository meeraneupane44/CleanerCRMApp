// lib/uploadImage.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { supabase } from './supabase';

type Kind = 'before' | 'after';
const BUCKET = 'photos';

const withCB = (url: string) => `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;

function extFromMime(mime: string) {
  const m = (mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/heic' || m === 'image/heif') return 'jpg';
  return 'jpg';
}

function getMimeAndExtFromUri(uri: string) {
  if (uri.startsWith('data:')) {
    const m = uri.match(/^data:([^;]+);base64,/i);
    const mime = (m?.[1] || 'image/jpeg').toLowerCase();
    return { mime, ext: extFromMime(mime) };
  }
  const raw = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  let ext = raw || 'jpg';
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'heic' || ext === 'heif') ext = 'jpg';
  const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return { mime: mime.toLowerCase(), ext };
}

// tiny base64 -> Uint8Array decoder (no deps)
function b64ToBytes(b64: string) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let i = 0, j = 0, tmp = 0;
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  let len = clean.length;
  let outLen = (len * 3) >> 2;
  if (clean.endsWith('==')) outLen -= 2;
  else if (clean.endsWith('=')) outLen -= 1;
  const out = new Uint8Array(outLen);
  for (; i < len; i += 4) {
    const enc1 = chars.indexOf(clean[i]);
    const enc2 = chars.indexOf(clean[i + 1]);
    const enc3 = chars.indexOf(clean[i + 2]);
    const enc4 = chars.indexOf(clean[i + 3]);
    tmp = (enc1 << 18) | (enc2 << 12) | ((enc3 & 63) << 6) | (enc4 & 63);
    if (j < outLen) out[j++] = (tmp >> 16) & 0xff;
    if (j < outLen && enc3 !== 64) out[j++] = (tmp >> 8) & 0xff;
    if (j < outLen && enc4 !== 64) out[j++] = tmp & 0xff;
  }
  return out;
}

export async function uploadJobPhoto({
  jobId,
  uri,
  kind,
  wantSignedUrl = false, // set true if bucket is private
}: {
  jobId: string;
  uri: string;
  kind: Kind;
  wantSignedUrl?: boolean;
}) {
  console.log('[uploadJobPhoto] START', {
    bucket: BUCKET,
    jobId,
    kind,
    platform: Platform.OS,
    uri: uri.slice(0, 64) + (uri.length > 64 ? '…' : ''),
  });

  // ----- Re-encode HEIC/HEIF → JPEG (common on iOS) -----
  const initial = getMimeAndExtFromUri(uri);
  let workingUri = uri;
  let finalMime = initial.mime;
  let finalExt = initial.ext;

  if (
    initial.mime === 'image/heic' ||
    initial.mime === 'image/heif' ||
    /(\.heic|\.heif)(\?|$)/i.test(uri)
  ) {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    workingUri = out.uri;
    finalMime = 'image/jpeg';
    finalExt = 'jpg';
    console.log('[uploadJobPhoto] HEIC→JPEG', { newUri: workingUri });
  }

  // ----- Read bytes robustly on native -----
  let fileBody: ArrayBuffer | Uint8Array | Blob;
  let byteLen = 0;

  try {
    const resp = await fetch(workingUri);
    if (!resp.ok) throw new Error(`read image failed (${resp.status})`);
    const buf = await resp.arrayBuffer();
    byteLen = buf.byteLength;
    if (byteLen > 0) {
      // Use raw bytes (avoids flaky RN Blob)
      fileBody = buf;
    } else {
      throw new Error('arrayBuffer length 0');
    }
  } catch (e) {
    // Fallback: FileSystem base64 → bytes
    console.warn('[uploadJobPhoto] fetch/arrayBuffer fallback, using FileSystem base64', e);
    const b64 = await FileSystem.readAsStringAsync(workingUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = b64ToBytes(b64);
    fileBody = bytes;
    byteLen = bytes.byteLength;
  }

  if (!byteLen) {
    throw new Error('Image byte length is 0 after all fallbacks');
  }
  console.log('[uploadJobPhoto] byteLength', byteLen);

  // ----- Storage path (no leading slash) -----
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeJob = String(jobId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const path = `jobs/${safeJob}/${kind}-${unique}.${finalExt}`;
  console.log('[uploadJobPhoto] path', path);

  // Bucket sanity
  const probe = await supabase.storage.from(BUCKET).list('', { limit: 1 });
  if (probe.error && String(probe.error.message).includes('Bucket not found')) {
    throw new Error(`Storage bucket "${BUCKET}" not found in this Supabase project`);
  }

  // ----- Upload (prefer signed upload) -----
  console.log('[uploadJobPhoto] createSignedUploadUrl…');
  const { data: signed, error: signErr } =
    await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (!signErr && signed?.token) {
    const { error: up2Err } = await supabase.storage
      .from(BUCKET)
      // @ts-ignore: accepts ArrayBuffer/Uint8Array
      .uploadToSignedUrl(path, signed.token, fileBody, { contentType: finalMime });
    if (up2Err) throw up2Err;
    console.log('[uploadJobPhoto] signed upload OK');
  } else {
    console.warn('[uploadJobPhoto] signed upload unavailable, using direct upload…', signErr);
    // Direct upload (works if current user has Storage insert permission)
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      // @ts-ignore: accepts ArrayBuffer/Uint8Array
      .upload(path, fileBody, { contentType: finalMime, upsert: true });
    if (upErr) throw upErr;
    console.log('[uploadJobPhoto] direct upload OK');
  }

  // ----- Preview URL (cache-busted) -----
  let renderUrl: string;
  if (wantSignedUrl) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw error || new Error('Signed URL failed');
    renderUrl = withCB(data.signedUrl);
  } else {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    renderUrl = withCB(data.publicUrl);
  }
  console.log('[uploadJobPhoto] renderUrl', renderUrl.slice(0, 120) + '…');

  // ----- DB record tying photo to job -----
  const { data: row, error: insErr } = await supabase
    .from('photos')
    .insert({ job_id: jobId, type: kind, image_url: path })
    .select()
    .single();
  if (insErr) throw insErr;

  console.log('[uploadJobPhoto] SUCCESS', { path });
  return { path, renderUrl, row };
}
