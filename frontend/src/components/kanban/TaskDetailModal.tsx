import React, { useState } from 'react';
import { Modal, Badge, Button, ConfirmDialog } from '@/components/common';
import { Task } from '@/types/task';
import { Avatar } from '@/components/common/Avatar';
import { formatDate, formatRelativeTime } from '@/utils/colors';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';

export interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  isDeleting?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!task) return null;

  const isOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now();

  const priorityVariants: Record<string, 'rose' | 'amber' | 'blue'> = {
    high: 'rose',
    medium: 'amber',
    low: 'blue',
  };

  const statusVariants: Record<string, 'amber' | 'blue' | 'emerald'> = {
    todo: 'amber',
    doing: 'blue',
    done: 'emerald',
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariants[task.status] || 'neutral'} size="sm" dot>
                  {task.status === 'doing' ? 'In Progress' : task.status}
                </Badge>
                <Badge variant={priorityVariants[task.priority] || 'neutral'} size="sm">
                  {task.priority} Priority
                </Badge>
                {task.is_team_task && (
                  <Badge variant="purple" size="sm">
                    Team Directive
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                {task.title}
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Directive Description
            </h4>
            {task.description ? (
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">No additional details specified.</p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                Deadline
              </span>
              <span
                className={`font-mono flex items-center gap-1 ${
                  isOverdue && task.status !== 'done'
                    ? 'text-rose-400 font-bold'
                    : 'text-gray-300'
                }`}
              >
                {isOverdue && task.status !== 'done' ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                )}
                {task.deadline ? formatDate(task.deadline) : 'None'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                Created By
              </span>
              <span className="text-gray-300 font-medium truncate block capitalize">
                {task.created_by.split('@')[0]}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                Created At
              </span>
              <span className="text-gray-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                {formatRelativeTime(task.created_at)}
              </span>
            </div>
          </div>

          {/* Assignees Progress List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Squad Assignees ({task.assignees?.length || 0})
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {task.assignees?.map((assignee) => (
                <div
                  key={assignee.email}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar email={assignee.email} size="sm" />
                    <div>
                      <p className="font-semibold text-white capitalize leading-tight">
                        {assignee.email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-gray-500">{assignee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {assignee.status === 'done' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    ) : assignee.status === 'doing' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        To Do
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteConfirmOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              disabled={isDeleting}
            >
              Delete Directive
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Directive
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onClose();
          onDelete(task.id);
        }}
        title="Delete Directive?"
        message={`Are you sure you want to permanently remove "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Directive"
        variant="danger"
      />
    </>
  );
};
