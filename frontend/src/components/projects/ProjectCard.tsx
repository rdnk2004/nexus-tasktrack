import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, ProjectStatus } from '@/types/project';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate } from '@/utils/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  Calendar,
  CheckCircle2,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onUpdateStatus: (projectId: number, status: ProjectStatus) => void;
  onDelete: (projectId: number) => void;
  isActionLoading?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onUpdateStatus,
  onDelete,
  isActionLoading = false,
}) => {
  const { user } = useAuthStore();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const isOwner = project.created_by === user?.email;
  const progress =
    project.total_tasks > 0
      ? Math.round((project.completed_tasks / project.total_tasks) * 100)
      : 0;

  const statusBadgeVariants: Record<ProjectStatus, 'emerald' | 'blue' | 'neutral'> = {
    active: 'emerald',
    done: 'blue',
    archived: 'neutral',
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
        <div>
          {/* Top badges bar */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={statusBadgeVariants[project.status]} size="xs" dot>
                {project.status}
              </Badge>
              {project.is_collaborative ? (
                <Badge variant="purple" size="xs">
                  Squad
                </Badge>
              ) : (
                <Badge variant="neutral" size="xs">
                  Individual
                </Badge>
              )}
            </div>

            {isOwner && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Owner
              </span>
            )}
          </div>

          {/* Project Title */}
          <Link
            to={`/projects/${project.id}/tasks`}
            className="block group/link"
          >
            <h3 className="text-base font-bold text-white group-hover/link:text-amber-300 transition-colors leading-tight">
              {project.name}
            </h3>
          </Link>

          {/* Description */}
          {project.description ? (
            <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic mt-2">No description provided.</p>
          )}

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-1.5">
              <span>Directives Progress</span>
              <span className="font-bold text-white">
                {project.completed_tasks}/{project.total_tasks} ({progress}%)
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  project.status === 'done'
                    ? 'bg-blue-500'
                    : progress === 100
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timeline and Team Info */}
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                {project.start_date && project.end_date
                  ? `${formatDate(project.start_date)} - ${formatDate(project.end_date)}`
                  : 'Ongoing'}
              </span>
            </div>

            {/* Members Avatar Stack */}
            {project.members && project.members.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-500 font-medium">Assigned Squad:</span>
                <div className="flex items-center -space-x-1.5">
                  {project.members.slice(0, 4).map((m) => (
                    <Avatar key={m.email} email={m.email} size="xs" />
                  ))}
                  {project.members.length > 4 && (
                    <span className="w-5 h-5 rounded-md bg-neutral-800 text-gray-400 text-[9px] font-bold flex items-center justify-center border border-neutral-900">
                      +{project.members.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
          <Link
            to={`/projects/${project.id}/tasks`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Kanban Board <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Edit Project Details"
                disabled={isActionLoading}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {project.status === 'active' && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(project.id, 'done')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Mark Project as Complete"
                    disabled={isActionLoading}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(project.id, 'archived')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                    title="Archive Project"
                    disabled={isActionLoading}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {project.status === 'done' && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(project.id, 'active')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Reopen Project"
                    disabled={isActionLoading}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(project.id, 'archived')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                    title="Archive Project"
                    disabled={isActionLoading}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {project.status === 'archived' && (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(project.id, 'active')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Restore to Active"
                    disabled={isActionLoading}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Permanently Delete Project"
                    disabled={isActionLoading}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(project.id);
        }}
        title="Permanently Delete Project?"
        message={`Are you sure you want to remove "${project.name}"? All associated tasks, assignees, and activity history will be permanently wiped.`}
        confirmText="Delete Project"
        variant="danger"
      />
    </>
  );
};
