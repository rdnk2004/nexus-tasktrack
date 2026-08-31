import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '@/types/project';
import { Avatar } from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/utils/colors';
import { FolderKanban, Plus, ArrowUpRight, Calendar } from 'lucide-react';

interface DashboardProjectsProps {
  projects?: Project[];
  isLoading: boolean;
}

export const DashboardProjects: React.FC<DashboardProjectsProps> = ({ projects, isLoading }) => {
  return (
    <section className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2.5 tracking-tight">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            Active Projects
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
              {projects?.length ?? 0}
            </span>
          </h2>
          <Link
            to="/projects"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition-all"
            title="Manage Projects"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
            <FolderKanban className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No active projects currently.</p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Create your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => {
              const progress =
                project.total_tasks > 0
                  ? Math.round((project.completed_tasks / project.total_tasks) * 100)
                  : 0;

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/tasks`}
                  className="block p-4 rounded-xl bg-black/40 hover:bg-neutral-900 border border-white/5 hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.is_collaborative && (
                          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                            Squad
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mb-1">
                      <span>{project.completed_tasks}/{project.total_tasks} Tasks</span>
                      <span className="font-bold text-amber-400">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer info: deadline + members */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400/80" />
                      {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
                    </span>
                    <div className="flex items-center -space-x-1.5">
                      {project.members?.slice(0, 3).map((m) => (
                        <Avatar key={m.email} email={m.email} size="xs" />
                      ))}
                      {(project.members?.length || 0) > 3 && (
                        <span className="w-5 h-5 rounded-md bg-neutral-800 text-gray-400 text-[9px] font-bold flex items-center justify-center border border-neutral-900">
                          +{project.members.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5">
        <Link
          to="/projects"
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 font-bold transition-colors w-full py-1.5 rounded-lg hover:bg-white/5"
        >
          View all projects <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
};
