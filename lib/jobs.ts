// lib/jobs.ts
import { supabase } from './supabase';

export type JobRow = {
  id: string;
  client_id: string | null;
  cleaner_id: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  date: string | null;        // YYYY-MM-DD
  start_time: string | null;  // HH:MM:SS
  end_time: string | null;    // HH:MM:SS
  address: string | null;
  notes: string | null;
  created_by?: string | null;
  created_at?: string | null;
  check_in_at?: string | null;   // timestamptz
  check_out_at?: string | null;  // timestamptz
};

export type TaskRow = {
  id: string;
  job_id: string;
  description: string;
  is_completed: boolean;
  created_at?: string | null;
};

export async function fetchMyUpcomingJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as JobRow[];
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
    .order('created_at', { ascending: true });
  if (taskErr) throw taskErr;

  return { job: job as JobRow, tasks: (tasks ?? []) as TaskRow[] };
}

/** Set check-in timestamp (now). Also flips status to in_progress. */
export async function checkInJob(jobId: string) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('jobs')
    .update({ check_in_at: nowIso, status: 'in_progress' })
    .eq('id', jobId)
    .select('id, check_in_at, status')
    .single();
  if (error) throw error;
  return data as Pick<JobRow, 'id' | 'check_in_at' | 'status'>;
}

/** Set check-out timestamp (now). Also flips status to completed. */
export async function checkOutJob(jobId: string) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('jobs')
    .update({ check_out_at: nowIso, status: 'completed' })
    .eq('id', jobId)
    .select('id, check_out_at, status')
    .single();
  if (error) throw error;
  return data as Pick<JobRow, 'id' | 'check_out_at' | 'status'>;
}
