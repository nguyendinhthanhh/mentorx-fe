import { Check, Sparkles } from 'lucide-react'

interface Category { categoryId: number; name: string; slug: string; description?: string; iconUrl?: string }

interface Props {
  categories: Category[]
  selectedCategoryIds: number[]
  setSelectedCategoryIds: (v: number[]) => void
}

export default function StepExpertise({ categories, selectedCategoryIds, setSelectedCategoryIds }: Props) {
  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(c => c !== id))
    } else if (selectedCategoryIds.length < 3) {
      setSelectedCategoryIds([...selectedCategoryIds, id])
    }
  }

  return (
    <div className="onb-fade-in-up space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold mb-5 onb-fade-in-scale">
          <Sparkles className="w-4 h-4" /> Step 2 of 6
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Fields of Interest</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
          Pick up to <span className="text-primary-600 font-bold">3 fields</span> that you are interested in
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Select Categories</label>
          <span className={`text-sm font-bold ${selectedCategoryIds.length > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
            {selectedCategoryIds.length}/3
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat, i) => {
            const selected = selectedCategoryIds.includes(cat.categoryId)
            const disabled = !selected && selectedCategoryIds.length >= 3
            return (
              <button
                key={cat.categoryId}
                onClick={() => toggleCategory(cat.categoryId)}
                disabled={disabled}
                className={`onb-fade-in-scale onb-stagger-${Math.min(i + 1, 8)} flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                  selected
                    ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/5 scale-[1.02]'
                    : disabled
                    ? 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${selected ? 'bg-primary-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-700'}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedCategoryIds.length === 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl animate-pulse">
          <p className="text-sm text-amber-700 dark:text-amber-400 text-center font-medium">
            Please select at least one field to continue
          </p>
        </div>
      )}
    </div>
  )
}
