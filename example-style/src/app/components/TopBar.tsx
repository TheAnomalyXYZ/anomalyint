import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { LayoutGrid } from 'lucide-react';

const projects = [
  'All',
  'Moo.F.O.',
  'Vectra',
  'GMeow',
  'Neura Knights',
  'Goonville',
  'Synapse',
  'Dont Die',
];

export function TopBar() {
  const [environment, setEnvironment] = useState<'prod' | 'staging'>('prod');
  const [selectedProject, setSelectedProject] = useState('All');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  return (
    <div className="h-16 bg-transparent border-b border-default flex items-center justify-between px-3 gap-3">
      {/* Left side - Pill container with environment and project */}
      <div className="bg-card rounded-full p-1.5 flex items-center gap-1 min-w-0 flex-shrink">
        {/* Environment Switcher */}
        <div className="bg-page rounded-full p-1 flex flex-shrink-0">
          <button
            onClick={() => setEnvironment('prod')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              environment === 'prod'
                ? 'bg-[#22C55E] text-white'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="hidden sm:inline">Production</span>
            <span className="sm:hidden">Prod</span>
          </button>
          <button
            onClick={() => setEnvironment('staging')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              environment === 'staging'
                ? 'bg-[#F59E0B] text-white'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="hidden sm:inline">Staging</span>
            <span className="sm:hidden">Stg</span>
          </button>
        </div>

        {/* Project Selector */}
        <div className="relative min-w-0 flex-1">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="bg-page px-4 py-2 rounded-full flex items-center gap-2 text-primary hover:bg-hover transition-colors cursor-pointer w-full min-w-0"
          >
            <span className="text-sm font-medium truncate min-w-0">{selectedProject}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>
          
          {showProjectDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-card border border-default rounded-xl shadow-lg overflow-hidden z-50 min-w-[180px]">
              {projects.map((project) => (
                <button
                  key={project}
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer"
                >
                  {project}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Circular container for theme toggle */}
      <div className="bg-card rounded-full p-1 hidden sm:block">
        <ThemeToggle />
      </div>
    </div>
  );
}