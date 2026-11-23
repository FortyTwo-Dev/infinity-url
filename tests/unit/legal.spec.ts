import { describe, expect, it } from 'vitest'

import {
  LEGAL_DOCUMENTS,
  LEGAL_SLUGS,
  LEGAL_UPDATED_AT,
  isLegalSlug,
} from '~/lib/legal/fr'

const expectedSlugs = [
  'notice',
  'terms',
  'aup',
  'privacy',
  'subcontractors',
  'client-clause',
]

describe('legal content', () => {
  it('exposes the six legal documents', () => {
    expect([...LEGAL_SLUGS].sort()).toEqual([...expectedSlugs].sort())
  })

  it('gives every document a title, a date and non-empty sections', () => {
    expect(LEGAL_UPDATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    for (const slug of LEGAL_SLUGS) {
      const document = LEGAL_DOCUMENTS[slug]

      expect(document.title.trim(), slug).not.toBe('')
      expect(document.updatedAt, slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(document.sections.length, slug).toBeGreaterThan(0)

      for (const section of document.sections) {
        expect(section.heading.trim(), slug).not.toBe('')
        expect(section.paragraphs.length, slug).toBeGreaterThan(0)

        for (const paragraph of section.paragraphs) {
          expect(paragraph.trim(), slug).not.toBe('')
        }
      }
    }
  })

  it('never publishes a placeholder', () => {
    const prose = JSON.stringify(LEGAL_DOCUMENTS)

    expect(prose).not.toMatch(/\[À FOURNIR|À compléter|TODO|lorem ipsum/i)
  })

  it('recognises only a known legal slug', () => {
    expect(isLegalSlug('privacy')).toBe(true)
    expect(isLegalSlug('client-clause')).toBe(true)
    expect(isLegalSlug('unknown')).toBe(false)
    expect(isLegalSlug('')).toBe(false)
  })
})
