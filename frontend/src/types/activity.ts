export type ActivityType =
  | 'project_created'
  | 'project_completed'
  | 'project_archived'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'member_added';

export interface Activity {
  id: number;
  user_email: string;
  user_name: string;
  activity_type: ActivityType;
  description: string;
  project_id: number;
  project_name: string;
  created_at: string;
  humanized_time: string;
  color: string;
}

export interface DashboardMemberStat {
  email: string;
  name: string;
  active_projects: number;
  completed_tasks_this_week: number;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_tasks: number;
  completed_tasks: number;
  members: DashboardMemberStat[];
}
