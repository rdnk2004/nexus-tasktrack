import React, { useState } from 'react';
import { Project, ProjectStatus } from '@/types/project';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { Skeleton } from '@/components/common/Skeleton';
import { Button, Input } from '@/components/common';
import { FolderKanban, Plus, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export const ProjectsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'collaborative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const queryParams = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
  };

  const { data: projects, isLoading } = useProjectsQuery(queryParams);
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const handleOpenCreateModal = () => {
    setProjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectToEdit(null);
  };

  // Filter projects client-side by search query
  const filteredProjects = (projects || []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  });

  const activeCount = (projects || []).filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FolderKanban className="w-3.5 h-3.5" /> Project Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Projects &amp; Squads
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Individual directives and collaborative multi-operator work streams.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Project
        </Button>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {(['all', 'active', 'done', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap',
                statusFilter === status
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <Filter className="w-3.5 h-3.5 text-gray-500 ml-2 mr-1 shrink-0" />
            {(['all', 'individual', 'collaborative'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all whitespace-nowrap',
                  typeFilter === type
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <FolderKanban className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? `No projects matching "${searchQuery}". Try adjusting your search query or filters.`
              : 'You have no projects under the selected filter criteria.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="mt-2"
          >
            Create New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleOpenEditModal}
              onUpdateStatus={(id, status) =>
                updateMutation.mutate({ projectId: id, data: { status } })
              }
              onDelete={(id) => deleteMutation.mutate(id)}
              isActionLoading={updateMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Project Create / Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projectToEdit={projectToEdit}
        onSubmitCreate={async (data) => {
          await createMutation.mutateAsync(data);
          handleCloseModal();
        }}
        onSubmitUpdate={async (id, data) => {
          await updateMutation.mutateAsync({ projectId: id, data });
          handleCloseModal();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
