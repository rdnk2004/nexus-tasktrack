export type ProjectStatus = 'active' | 'done' | 'archived';

export interface MemberInfo {
  email: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  start_date?: string | null;
  end_date?: string | null;
  members: MemberInfo[];
  total_tasks: number;
  completed_tasks: number;
  is_collaborative: boolean;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  members: string[];
  start_date: string;
  end_date: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
}
