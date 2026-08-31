import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useProjectsQuery,
  useProjectDetailQuery,
} from '@/hooks/useProjects';
import {
  useProjectTasksQuery,
  useOptimisticTaskStatusMutation,
} from '@/hooks/useTasks';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { Button, Select } from '@/components/common';
import { formatDate } from '@/utils/colors';
import {
  FolderKanban,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const { data: activeProjects, isLoading: isProjectsLoading } = useProjectsQuery({
    status: 'active',
  });

  const parsedId = routeProjectId ? parseInt(routeProjectId, 10) : undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(parsedId);

  // If no route parameter is provided, default to the first active project
  useEffect(() => {
    if (parsedId) {
      setSelectedProjectId(parsedId);
    } else if (activeProjects && activeProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(activeProjects[0].id);
    }
  }, [parsedId, activeProjects, selectedProjectId]);

  const currentProjectId = selectedProjectId || 0;
  const { data: project, isLoading: isProjectDetailLoading } = useProjectDetailQuery(currentProjectId);
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasksQuery(currentProjectId);

  const statusMutation = useOptimisticTaskStatusMutation(currentProjectId);

  const handleSelectProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = parseInt(e.target.value, 10);
    setSelectedProjectId(newId);
    navigate(`/projects/${newId}/tasks`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Switcher & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
            </Link>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project ? project.name : 'Kanban Task Board'}
            </h1>

            {project && (
              <div className="flex items-center gap-2">
                <Badge variant={project.is_collaborative ? 'purple' : 'neutral'} size="xs">
                  {project.is_collaborative ? 'Squad' : 'Individual'}
                </Badge>
                <Badge variant="emerald" size="xs" dot>
                  {project.status}
                </Badge>
              </div>
            )}
          </div>

          {project && (
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Sprint Deadline: {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
              </span>

              {/* Members Avatar Stack */}
              {project.members && project.members.length > 0 && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
                  <span className="text-[11px] text-gray-500">Squad:</span>
                  <div className="flex items-center -space-x-1.5">
                    {project.members.map((m) => (
                      <Avatar key={m.email} email={m.email} size="xs" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {activeProjects && activeProjects.length > 0 && (
            <div className="min-w-[200px]">
              <Select
                value={currentProjectId}
                onChange={handleSelectProjectChange}
                className="py-2 text-xs font-semibold"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Main Kanban Workspace */}
      {isProjectsLoading || isProjectDetailLoading || isTasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : !currentProjectId ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <Layers className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No active projects available</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You must create or join an active project before managing Kanban task directives.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/projects')}
            leftIcon={<FolderKanban className="w-4 h-4" />}
            className="mt-2"
          >
            Go to Projects
          </Button>
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks || []}
          onUpdateStatus={(taskId, newStatus) =>
            statusMutation.mutate({ taskId, status: newStatus })
          }
        />
      )}
    </div>
  );
};
