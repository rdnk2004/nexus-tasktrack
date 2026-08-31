import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '@/components/common';
import { Project, ProjectCreateInput, ProjectUpdateInput } from '@/types/project';
import { useAllUsersQuery } from '@/hooks/useProjects';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Avatar } from '@/components/common/Avatar';
import { Calendar, Users, FolderPlus, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate?: (data: ProjectCreateInput) => Promise<void> | void;
  onSubmitUpdate?: (projectId: number, data: ProjectUpdateInput) => Promise<void> | void;
  projectToEdit?: Project | null;
  isLoading?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  projectToEdit,
  isLoading = false,
}) => {
  const { user } = useAuthStore();
  const { data: allUsers } = useAllUsersQuery();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');

  const isEditMode = !!projectToEdit;

  // Initialize or reset form values
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setStartDate(
        projectToEdit.start_date
          ? new Date(projectToEdit.start_date).toISOString().split('T')[0]
          : ''
      );
      setEndDate(
        projectToEdit.end_date
          ? new Date(projectToEdit.end_date).toISOString().split('T')[0]
          : ''
      );
      setSelectedMembers(
        (projectToEdit.members || [])
          .filter((m) => m.role !== 'owner' && m.email !== user?.email)
          .map((m) => m.email)
      );
      setError('');
    } else {
      // Default new project: today -> 7 days ahead
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      setName('');
      setDescription('');
      setStartDate(now.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
      setSelectedMembers([]);
      setError('');
    }
  }, [projectToEdit, isOpen, user?.email]);

  const applyDurationPreset = (days: number) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const toggleMember = (memberEmail: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberEmail)
        ? prev.filter((e) => e !== memberEmail)
        : [...prev, memberEmail]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays < 1) {
      setError('Project duration must be at least 1 day');
      return;
    }
    if (durationDays > 14) {
      setError('Project duration cannot exceed 14 days');
      return;
    }

    setError('');

    if (isEditMode && projectToEdit && onSubmitUpdate) {
      await onSubmitUpdate(projectToEdit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
    } else if (onSubmitCreate) {
      await onSubmitCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        members: selectedMembers,
      });
    }
  };

  // Available users excluding current user (who is creator / auto-owner)
  const availableUsers = (allUsers || []).filter((u) => u !== user?.email);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FolderPlus className="w-4 h-4" />
          </div>
          <span>{isEditMode ? 'Edit Project Governance' : 'Create New Project'}</span>
        </div>
      }
      description={
        isEditMode
          ? 'Modify directive metadata and timeline.'
          : 'Define a new project sprint, assign squad members, and establish delivery timeline.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-3">
        {/* Project Name */}
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q4 Platform Migration"
          required
        />

        {/* Description */}
        <Textarea
          label="Description & Objectives (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Outline goals, deliverables, and architecture considerations..."
          rows={3}
        />

        {/* Timeline Dates */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Sprint Timeline (1 - 14 Days)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 font-medium">Presets:</span>
              {[3, 7, 14].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => applyDurationPreset(days)}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all"
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>
        </div>

        {/* Squad Members Multi-Select (Only on Create) */}
        {!isEditMode && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Collaborative Squad (Optional)
              </label>
              <span className="text-[10px] text-gray-500">
                {selectedMembers.length} selected
              </span>
            </div>

            <p className="text-[11px] text-gray-500 mb-2">
              Select team members to assign to this project. You ({user?.email}) are automatically assigned as owner.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {availableUsers.map((memberEmail) => {
                const isSelected = selectedMembers.includes(memberEmail);
                const name = memberEmail.split('@')[0];

                return (
                  <button
                    key={memberEmail}
                    type="button"
                    onClick={() => toggleMember(memberEmail)}
                    className={clsx(
                      'flex items-center gap-2 p-2 rounded-xl text-left border transition-all',
                      isSelected
                        ? 'bg-amber-500/15 text-white border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-200'
                    )}
                  >
                    <Avatar email={memberEmail} size="xs" />
                    <span className="text-xs font-medium truncate capitalize">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Modal Actions */}
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
            {isEditMode ? 'Save Changes' : 'Initialize Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
