// lib/uploadImage.ts
import { supabase } from './supabase';

export async function uploadJobPhoto({
  jobId,
  uri,
  kind, // 'before' | 'after'
}: { jobId: string; uri: string; kind: 'before' | 'after' }) {
  // turn RN file URI into Blob
  const resp = await fetch(uri);
  const blob = await resp.blob();

  const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
  const path = `jobs/${jobId}/${kind}-${Date.now()}.${ext}`;

  // ✅ Storage API (note the `.storage`)
  const { error: uploadErr } = await supabase
    .storage
    .from('job-photos')
    .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

  if (uploadErr) throw uploadErr;

  // Save a DB record in your photos table (optional but recommended)
  const { data: row, error: insertErr } = await supabase
    .from('photos')
    .insert({ job_id: jobId, type: kind, image_url: path })
    .select()
    .single();

  if (insertErr) throw insertErr;

  // Public bucket -> public URL; private -> use signed URLs when rendering
  const { data: { publicUrl } } =
    supabase.storage.from('job-photos').getPublicUrl(path);

  return { path, publicUrl, row };
}
