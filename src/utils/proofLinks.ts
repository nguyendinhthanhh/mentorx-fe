import { MentorProfileRequest, MentorProfileResponse, ProofLink } from '@/types'

type ProofLinkSource = Partial<
  Pick<
    MentorProfileRequest & MentorProfileResponse,
    'proofLinks' | 'linkedinUrl' | 'githubUrl' | 'portfolioUrl' | 'portfolioEvidenceUrl' | 'videoIntroUrl'
  >
>

const LEGACY_LINK_DEFINITIONS: Array<{ label: string; key: keyof ProofLinkSource }> = [
  { label: 'LinkedIn profile', key: 'linkedinUrl' },
  { label: 'GitHub profile', key: 'githubUrl' },
  { label: 'Portfolio', key: 'portfolioUrl' },
  { label: 'Proof of work', key: 'portfolioEvidenceUrl' },
  { label: 'Intro video', key: 'videoIntroUrl' },
]

function normalizeText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : ''
}

function tryParseUrl(value: string) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function normalizeProofLinks(links?: Array<Partial<ProofLink> | null | undefined>) {
  if (!links?.length) return [] as ProofLink[]

  const deduped = new Map<string, ProofLink>()

  for (const item of links) {
    const label = normalizeText(item?.label)
    const url = normalizeText(item?.url)
    if (!label || !url) continue
    const key = `${label.toLowerCase()}|${url.toLowerCase()}`
    if (!deduped.has(key)) {
      deduped.set(key, { label, url })
    }
  }

  return Array.from(deduped.values())
}

export function getMentorProofLinks(source?: ProofLinkSource | null) {
  const explicit = normalizeProofLinks(source?.proofLinks)
  if (explicit.length > 0) {
    return explicit
  }

  return normalizeProofLinks(
    LEGACY_LINK_DEFINITIONS.map(({ label, key }) => ({
      label,
      url: typeof source?.[key] === 'string' ? source[key] : '',
    }))
  )
}

function labelLooksLike(label: string, candidates: string[]) {
  const lower = label.toLowerCase()
  return candidates.some((candidate) => lower.includes(candidate))
}

export function deriveLegacyProofFields(proofLinks: ProofLink[]) {
  const normalized = normalizeProofLinks(proofLinks)

  const legacy: Pick<
    MentorProfileRequest,
    'linkedinUrl' | 'githubUrl' | 'portfolioUrl' | 'portfolioEvidenceUrl' | 'videoIntroUrl'
  > = {}

  for (const item of normalized) {
    const parsed = tryParseUrl(item.url)
    const host = parsed?.hostname.toLowerCase() || ''

    if (!legacy.linkedinUrl && (host === 'linkedin.com' || host.endsWith('.linkedin.com'))) {
      legacy.linkedinUrl = item.url
      continue
    }

    if (!legacy.githubUrl && (host === 'github.com' || host.endsWith('.github.com'))) {
      legacy.githubUrl = item.url
      continue
    }

    if (
      !legacy.videoIntroUrl &&
      (labelLooksLike(item.label, ['video', 'intro', 'youtube', 'vimeo'])
        || host.includes('youtube.com')
        || host === 'youtu.be'
        || host.includes('vimeo.com'))
    ) {
      legacy.videoIntroUrl = item.url
      continue
    }

    if (
      !legacy.portfolioUrl &&
      (labelLooksLike(item.label, ['portfolio', 'website', 'site', 'web', 'behance', 'dribbble'])
        || host.includes('behance.net')
        || host.includes('dribbble.com'))
    ) {
      legacy.portfolioUrl = item.url
      continue
    }

    if (
      !legacy.portfolioEvidenceUrl &&
      labelLooksLike(item.label, ['proof', 'case study', 'article', 'deck', 'work', 'project'])
    ) {
      legacy.portfolioEvidenceUrl = item.url
    }
  }

  return legacy
}
