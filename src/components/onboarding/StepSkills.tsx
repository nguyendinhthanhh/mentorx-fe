import { useState } from 'react'
import { Search, X, Plus, Sparkles } from 'lucide-react'

interface Skill { id: number; slug: string; labelEn: string; labelVi: string }
interface SelectedSkill { skillId: number; name: string; level: string }

interface Props {
  roleChoice: string
  allSkills: Skill[]
  selectedSkills: SelectedSkill[]
  setSelectedSkills: (v: SelectedSkill[]) => void
}

const levelColors: Record<string, string> = {
  BEGINNER: 'from-green-400 to-emerald-500',
  INTERMEDIATE: 'from-amber-400 to-orange-500',
  EXPERT: 'from-rose-400 to-red-500',
}

export default function StepSkills({ roleChoice, allSkills, selectedSkills, setSelectedSkills }: Props) {
  const [skillSearch, setSkillSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isMentor = roleChoice === 'MENTOR' || roleChoice === 'BOTH'

  const filteredSkills = allSkills
    .filter(s => s.labelEn.toLowerCase().includes(skillSearch.toLowerCase()) || s.labelVi.toLowerCase().includes(skillSearch.toLowerCase()))
    .filter(s => !selectedSkills.find(ss => ss.skillId === s.id))

  const addSkill = (skill: Skill) => {
    setSelectedSkills([...selectedSkills, { skillId: skill.id, name: skill.labelEn, level: 'INTERMEDIATE' }])
    setSkillSearch('')
    setDropdownOpen(false)
  }

  const removeSkill = (index: number) => setSelectedSkills(selectedSkills.filter((_, i) => i !== index))

  const changeLevel = (index: number, level: string) => {
    const updated = [...selectedSkills]
    updated[index] = { ...updated[index], level }
    setSelectedSkills(updated)
  }

  return (
    <div className="onb-fade-in-up space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 3 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          {isMentor ? 'Your Expertise & Skills' : 'Skills You Have or Want to Learn'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          {isMentor 
            ? 'What can you teach? Adding skills helps us find the right mentees for you.'
            : 'Adding your current skills helps us match you with the best mentors.'}
        </p>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
          {isMentor ? 'Search & Add Your Expertise' : 'Search & Add Your Skills'}
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all outline-none text-gray-900 dark:text-white text-sm"
            placeholder={isMentor ? "e.g. Java, System Design, Product Management..." : "e.g. React, Python, Communication..."}
            value={skillSearch}
            onChange={e => { setSkillSearch(e.target.value); setDropdownOpen(true) }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          />
          {dropdownOpen && skillSearch && filteredSkills.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-gray-100 dark:border-gray-800 max-h-56 overflow-y-auto z-50 onb-scrollbar onb-fade-in-scale">
              {filteredSkills.slice(0, 8).map(skill => (
                <button
                  key={skill.id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => addSkill(skill)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{skill.labelEn}</span>
                  <Plus className="w-4 h-4 text-primary-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedSkills.map((skill, index) => (
              <div key={skill.skillId} className="onb-fade-in-scale bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-4 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{skill.name}</span>
                  <button onClick={() => removeSkill(index)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {['BEGINNER', 'INTERMEDIATE', 'EXPERT'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => changeLevel(index, lvl)}
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                        skill.level === lvl
                          ? `bg-gradient-to-r ${levelColors[lvl]} text-white shadow-sm`
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSkills.length === 0 && (
          <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900 rounded-xl">
            <p className="text-sm text-sky-700 dark:text-sky-400">
              💡 <strong>Tip:</strong> Adding skills helps us tailor your experience. You can always skip this and add them later.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
