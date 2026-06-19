import { categoryApi } from '@/api/categoryApi'
import { skillApi } from '@/api/skillApi'
import { CategoryResponse, SkillResponse } from '@/types'

export type TaxonomySelection = {
  id?: number
  label: string
}

export type SkillChip = TaxonomySelection

export function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function labelsEqual(a: string, b: string) {
  return normalizeLabel(a).toLowerCase() === normalizeLabel(b).toLowerCase()
}

export function categoryLabel(category: CategoryResponse) {
  return category.name || category.slug || ''
}

export function skillLabel(skill: SkillResponse) {
  return skill.labelEn || skill.labelVi || skill.slug || ''
}

export function findExistingCategory(label: string, categories: CategoryResponse[]) {
  return categories.find((category) => labelsEqual(categoryLabel(category), label))
}

export function findExistingSkill(label: string, skills: SkillResponse[]) {
  return skills.find((skill) => [skill.labelEn, skill.labelVi, skill.slug].some((value) => value && labelsEqual(value, label)))
}

export async function resolveCategory(
  selection: TaxonomySelection,
  categories: CategoryResponse[],
  onResolved?: (category: CategoryResponse) => void
) {
  const label = normalizeLabel(selection.label)
  if (selection.id) return selection.id
  if (!label) throw new Error('Domain is required.')

  const existing = findExistingCategory(label, categories)
  if (existing) return existing.id

  const created = await categoryApi.create(label)
  onResolved?.(created)
  return created.id
}

export async function resolveSkillChips(
  chips: SkillChip[],
  skills: SkillResponse[],
  onResolved?: (skill: SkillResponse) => void
) {
  if (chips.length === 0) throw new Error('Add at least one skill.')

  const ids: number[] = []
  for (const chip of chips) {
    const label = normalizeLabel(chip.label)
    if (chip.id) {
      ids.push(chip.id)
      continue
    }
    const existing = findExistingSkill(label, skills)
    if (existing) {
      ids.push(existing.id)
      continue
    }
    const created = await skillApi.create(label)
    onResolved?.(created)
    ids.push(created.id)
  }

  return Array.from(new Set(ids))
}
