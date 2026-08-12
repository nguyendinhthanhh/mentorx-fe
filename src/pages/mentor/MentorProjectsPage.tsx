import { useSearchParams } from 'react-router-dom'
import { Briefcase, FileText, FolderKanban } from 'lucide-react'
import MentorProposalsPage from './MentorProposalsPage'
import MentorContractsPage from './MentorContractsPage'

type ProjectTab = 'proposals' | 'contracts'

const projectTabs: Array<{ key: ProjectTab; label: string; icon: typeof FolderKanban }> = [
  { key: 'proposals', label: 'Proposals', icon: FileText },
  { key: 'contracts', label: 'Contracts', icon: Briefcase },
]

export default function MentorProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as ProjectTab) || 'proposals'

  const handleTabChange = (tab: ProjectTab) => {
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <div className="space-y-6">
      {/* Premium Tab Bar */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 w-fit shadow-sm border border-slate-200 dark:border-slate-800/60">
        {projectTabs.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`group relative inline-flex h-11 items-center gap-2.5 rounded-xl px-5 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-md shadow-slate-200/60 ring-1 ring-inset ring-slate-200/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-950/50'
              }`}
            >
              <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'proposals' ? <MentorProposalsPage /> : <MentorContractsPage />}
      </div>
    </div>
  )
}
