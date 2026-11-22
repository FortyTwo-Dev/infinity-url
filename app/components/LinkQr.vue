<script setup lang="ts">
import initQr, { QrCodeWasm } from '@infinitylib/iqrcode-wasm'
import wasmUrl from '@infinitylib/iqrcode-wasm/iqrcode_wasm_bg.wasm?url'

import type { LinkDisplayStatus } from '~/lib/links/status'
import { downloadBlob, downloadUrl, toPngDataUrl, toSvg } from '~/lib/qr/render'

const props = defineProps<{
  shortUrl: string
  slug: string
  status: LinkDisplayStatus
}>()

const { t } = useI18n()

const canvas = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const matrix = ref<Uint8Array | null>(null)
const size = ref(0)

const moduleSize = 8
const quietZone = 4

let wasmReady: Promise<void> | null = null

function loadWasm(): Promise<void> {
  wasmReady ??= initQr({ module_or_path: wasmUrl }).then(
    () => undefined,
    (cause: unknown) => {
      wasmReady = null
      throw cause
    },
  )

  return wasmReady
}

async function generate(): Promise<void> {
  loading.value = true
  failed.value = false

  try {
    await loadWasm()

    const qr = new QrCodeWasm(props.shortUrl, 'M')

    try {
      matrix.value = qr.matrix()
      size.value = qr.size()
    } finally {
      qr.free()
    }

    await nextTick()
    draw()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function draw(): void {
  const element = canvas.value
  const current = matrix.value

  if (element === null || current === null) {
    return
  }

  const dimension = (size.value + quietZone * 2) * moduleSize

  element.width = dimension
  element.height = dimension
  element.style.width = '100%'
  element.style.maxWidth = '16rem'
  element.style.height = 'auto'

  const context = element.getContext('2d')

  if (context === null) {
    return
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, dimension, dimension)
  context.fillStyle = '#000000'

  for (let y = 0; y < size.value; y += 1) {
    for (let x = 0; x < size.value; x += 1) {
      if (current[y * size.value + x] === 1) {
        context.fillRect(
          (x + quietZone) * moduleSize,
          (y + quietZone) * moduleSize,
          moduleSize,
          moduleSize,
        )
      }
    }
  }
}

function renderOptions() {
  const current = matrix.value

  if (current === null) {
    return null
  }

  return {
    matrix: current,
    size: size.value,
    moduleSize,
    quietZone,
    dark: '#000000',
    light: '#ffffff',
  }
}

function downloadPng(): void {
  const options = renderOptions()

  if (options === null) {
    return
  }

  downloadUrl(toPngDataUrl(options), `qr-${props.slug}.png`)
}

function downloadSvg(): void {
  const options = renderOptions()

  if (options === null) {
    return
  }

  downloadBlob(
    new Blob([toSvg(options)], { type: 'image/svg+xml' }),
    `qr-${props.slug}.svg`,
  )
}

onMounted(generate)
watch(() => props.shortUrl, () => {
  void generate()
})
</script>

<template>
  <section class="qr">
    <h2 class="it-h2">
      {{ t('qr.title') }}
    </h2>
    <p class="it-small it-muted">
      {{ t('qr.description') }}
    </p>
    <p v-if="status !== 'active'" class="it-small">
      {{ t('qr.statusWarning') }}
    </p>

    <p v-if="loading" class="it-small" role="status">
      {{ t('qr.loading') }}
    </p>

    <ErrorBanner v-else-if="failed" :message="t('qr.error')" @retry="generate" />

    <canvas
      ref="canvas"
      class="qr__canvas"
      :class="{ 'qr__canvas--empty': loading || failed }"
    />

    <div v-if="!loading && !failed" class="qr__actions">
      <ItButton variant="secondary" size="sm" @click="downloadPng">
        {{ t('qr.downloadPng') }}
      </ItButton>
      <ItButton variant="secondary" size="sm" @click="downloadSvg">
        {{ t('qr.downloadSvg') }}
      </ItButton>
    </div>
  </section>
</template>
