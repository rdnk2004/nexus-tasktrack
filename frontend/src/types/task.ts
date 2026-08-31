export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface AssigneeInfo {
  email: string;
  status: TaskStatus;
  assigned_at: string;
  completed_at?: string | null;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string | null;
  created_by: string;
  is_team_task: boolean;
  created_at: string;
  updated_at: string;
  assignees: AssigneeInfo[];
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  assignees: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  deadline?: string;
  priority?: TaskPriority;
}

export interface TaskStatusUpdateInput {
  status: TaskStatus;
}
