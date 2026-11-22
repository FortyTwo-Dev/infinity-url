import { ItButton, ItField, ItInput, ItOption, ItSelect, ItTextarea } from '@infinitylib/infinity-theme-vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

import AbuseReportForm from '~/components/AbuseReportForm.vue'
import { ApiProblem } from '~/lib/api/problem'
import { submitReport } from '~/lib/api/report'

vi.mock('~/lib/api/report', () => ({ submitReport: vi.fn() }))

const request = vi.mocked(submitReport)

const themeComponents = {
  ItButton,
  ItField,
  ItInput,
  ItOption,
  ItSelect,
  ItTextarea,
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function mount(initialSlug = 'abc123') {
  return mountSuspended(AbuseReportForm, {
    props: { initialSlug },
    global: { components: themeComponents },
  })
}

async function submit(wrapper: Awaited<ReturnType<typeof mount>>): Promise<void> {
  await wrapper.find('form').trigger('submit')
  await tick()
}

describe('AbuseReportForm', () => {
  it('prefills the slug and sends an anonymous report', async () => {
    request.mockResolvedValue({ reference: '01JD3K8YQ4X7M2V9R5T1B6N0C3', status: 'received' })

    const wrapper = await mount()
    const slug = wrapper.find('input#report-slug')

    expect((slug.element as HTMLInputElement).value).toBe('abc123')

    await submit(wrapper)

    expect(request).toHaveBeenCalledWith({
      slug: 'abc123',
      category: 'phishing',
      details: undefined,
      email: undefined,
      website: '',
    })

    const output = wrapper.find('output')
    expect(output.text()).toContain('01JD3K8YQ4X7M2V9R5T1B6N0C3')
    expect(output.text()).toContain('48 heures')
  })

  it('keeps the typed text when the network fails', async () => {
    request.mockRejectedValue(new ApiProblem('network_error', 0))

    const wrapper = await mount('')

    await wrapper.find('input#report-slug').setValue('lost-slug')
    await wrapper.find('textarea#report-details').setValue('Received by SMS')
    await submit(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toContain('Impossible de joindre le service')
    expect((wrapper.find('input#report-slug').element as HTMLInputElement).value).toBe('lost-slug')
    expect((wrapper.find('textarea#report-details').element as HTMLTextAreaElement).value).toBe('Received by SMS')
  })

  it('maps a server field error to its translated label', async () => {
    request.mockRejectedValue(new ApiProblem('validation_failed', 422, { category: ['invalid'] }))

    const wrapper = await mount()
    await submit(wrapper)

    expect(wrapper.text()).toContain('Choisissez un motif')
  })

  it('shows the honeypot outside the accessibility tree', async () => {
    const wrapper = await mount()
    const trap = wrapper.find('.honeypot')

    expect(trap.exists()).toBe(true)
    expect(trap.attributes('aria-hidden')).toBe('true')
    expect(trap.find('input').attributes('tabindex')).toBe('-1')
  })

  it('refuses an obviously malformed email before calling the API', async () => {
    const wrapper = await mount()

    await wrapper.find('input#report-email').setValue('not-an-email')
    await submit(wrapper)

    expect(request).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Saisissez une adresse email valide')
  })

  it('refuses an empty slug before calling the API', async () => {
    const wrapper = await mount('')
    await submit(wrapper)

    expect(request).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Utilisez 2 à 64 caractères')
  })
})
