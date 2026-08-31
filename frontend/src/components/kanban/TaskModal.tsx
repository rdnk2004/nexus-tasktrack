import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Select, Button } from '@/components/common';
import { Task, TaskCreateInput, TaskUpdateInput, TaskPriority } from '@/types/task';
import { Project } from '@/types/project';
import { Avatar } from '@/components/common/Avatar';
import { ListPlus, Calendar, Sparkles, Users } from 'lucide-react';
import { clsx } from 'clsx';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  taskToEdit?: Task | null;
  onSubmitCreate?: (data: TaskCreateInput) => Promise<void> | void;
  onSubmitUpdate?: (taskId: number, data: TaskUpdateInput) => Promise<void> | void;
  isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  project,
  taskToEdit,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading = false,
}) => {
  const isEditMode = !!taskToEdit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [isTeamTask, setIsTeamTask] = useState(true);
  const [error, setError] = useState('');

  // Reset or populate fields
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setDeadline(
        taskToEdit.deadline
          ? new Date(taskToEdit.deadline).toISOString().split('T')[0]
          : ''
      );
      setAssignees(taskToEdit.assignees?.map((a) => a.email) || []);
      setIsTeamTask(taskToEdit.is_team_task);
      setError('');
    } else {
      // Default new task: deadline 2 days ahead
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);

      setTitle('');
      setDescription('');
      setPriority('medium');
      setDeadline(targetDate.toISOString().split('T')[0]);
      setAssignees([]);
      setIsTeamTask(true);
      setError('');
    }
  }, [taskToEdit, isOpen]);

  const applyDeadlinePreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().split('T')[0]);
  };

  const toggleAssignee = (email: string) => {
    setAssignees((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Directive title is required');
      return;
    }

    if (deadline) {
      const selected = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        setError('Directive deadline cannot be in the past');
        return;
      }
    }

    setError('');

    if (isEditMode && taskToEdit && onSubmitUpdate) {
      await onSubmitUpdate(taskToEdit.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
    } else if (onSubmitCreate) {
      const finalAssignees = isTeamTask ? ['ALL'] : assignees.length > 0 ? assignees : ['ALL'];
      await onSubmitCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        assignees: finalAssignees,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ListPlus className="w-4 h-4" />
          </div>
          <span>{isEditMode ? 'Edit Task Directive' : 'New Directive'}</span>
        </div>
      }
      description={`Project: ${project.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-3">
        {/* Title */}
        <Input
          label="Directive Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Implement JWT refresh endpoint"
          required
        />

        {/* Description */}
        <Textarea
          label="Details & Acceptance Criteria (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide context, links, or specific acceptance criteria..."
          rows={3}
        />

        {/* Priority & Deadline Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'low', label: 'Low Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'high', label: 'High Priority' },
            ]}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Deadline
              </label>
              <div className="flex gap-1">
                {[1, 2, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => applyDeadlinePreset(d)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-300"
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Assignees (Only on Create) */}
        {!isEditMode && project.is_collaborative && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" /> Assign To
            </label>

            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsTeamTask(true);
                  setAssignees([]);
                }}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-xl font-bold border transition-all',
                  isTeamTask
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-black/40 text-gray-400 border-white/5 hover:text-white'
                )}
              >
                Entire Squad (Broadcast)
              </button>
              <button
                type="button"
                onClick={() => setIsTeamTask(false)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-xl font-bold border transition-all',
                  !isTeamTask
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-black/40 text-gray-400 border-white/5 hover:text-white'
                )}
              >
                Specific Operators
              </button>
            </div>

            {!isTeamTask && (
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto pr-1">
                {project.members?.map((m) => {
                  const isSelected = assignees.includes(m.email);
                  const name = m.email.split('@')[0];
                  return (
                    <button
                      key={m.email}
                      type="button"
                      onClick={() => toggleAssignee(m.email)}
                      className={clsx(
                        'flex items-center gap-2 p-2 rounded-xl text-left border transition-all',
                        isSelected
                          ? 'bg-amber-500/15 text-white border-amber-500/40 shadow-sm'
                          : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-200'
                      )}
                    >
                      <Avatar email={m.email} size="xs" />
                      <span className="text-xs font-medium truncate capitalize">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isLoading}
            rightIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isEditMode ? 'Update Directive' : 'Add to Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
