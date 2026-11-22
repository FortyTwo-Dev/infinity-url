export interface MatrixRenderOptions {
  matrix: Uint8Array
  size: number
  moduleSize: number
  quietZone: number
  dark: string
  light: string
}

/** Build a standalone SVG string from a QR matrix. */
export function toSvg(options: MatrixRenderOptions): string {
  const { matrix, size, moduleSize, quietZone } = options
  const dimension = (size + quietZone * 2) * moduleSize
  const segments: string[] = []

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (matrix[y * size + x] !== 1) {
        continue
      }

      segments.push(
        `M${(x + quietZone) * moduleSize} ${(y + quietZone) * moduleSize}`
        + `h${moduleSize}v${moduleSize}h-${moduleSize}z`,
      )
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}"`,
    ` viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges">`,
    `<rect width="${dimension}" height="${dimension}" fill="${options.light}"/>`,
    `<path fill="${options.dark}" d="${segments.join('')}"/>`,
    '</svg>',
  ].join('')
}

/** Render a matrix to a PNG data URL. */
export function toPngDataUrl(options: MatrixRenderOptions): string {
  const { matrix, size, moduleSize, quietZone } = options
  const dimension = (size + quietZone * 2) * moduleSize
  const canvas = document.createElement('canvas')
  canvas.width = dimension
  canvas.height = dimension

  const context = canvas.getContext('2d')

  if (context === null) {
    throw new Error('Canvas 2D is not available.')
  }

  context.fillStyle = options.light
  context.fillRect(0, 0, dimension, dimension)
  context.fillStyle = options.dark

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (matrix[y * size + x] === 1) {
        context.fillRect(
          (x + quietZone) * moduleSize,
          (y + quietZone) * moduleSize,
          moduleSize,
          moduleSize,
        )
      }
    }
  }

  return canvas.toDataURL('image/png')
}

export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)

  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
