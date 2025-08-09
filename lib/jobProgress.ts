import { supabase } from './supabase';

export async function checkIn(jobId: string) {
  const { data, error } = await supabase.rpc('mark_check_in', { p_job_id: jobId });
  if (error) throw error;
  return data;
}

export async function checkOut(jobId: string) {
  const { data, error } = await supabase.rpc('mark_check_out', { p_job_id: jobId });
  if (error) throw error;
  return data;
}

export async function toggleTask(taskId: string, isCompleted: boolean) {
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: !isCompleted })
    .eq('id', taskId);
  if (error) throw error;
}
