import { supabase } from './supabase';

export async function fetchMyUpcomingJobs() {
  // show scheduled or in_progress jobs for the logged-in cleaner
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchJobWithTasks(jobId: string) {
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobErr) throw jobErr;

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true }); // if you want created_at, add that column
  if (taskErr) throw taskErr;

  return { job, tasks };
}
