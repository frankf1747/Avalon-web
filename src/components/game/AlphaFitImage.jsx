import { useEffect, useState } from 'react'

function defaultBounds() {
  return { left: 0, top: 0, contentW: 1, contentH: 1 }
}

async function detectAlphaBounds(src) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = src
  })

  const width = img.naturalWidth
  const height = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return defaultBounds()
  ctx.drawImage(img, 0, 0)

  const data = ctx.getImageData(0, 0, width, height).data
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 1) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < 0 || maxY < 0) return defaultBounds()

  const pad = Math.max(2, Math.round(Math.min(width, height) * 0.01))
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)

  return {
    left: minX / width,
    top: minY / height,
    contentW: (maxX - minX + 1) / width,
    contentH: (maxY - minY + 1) / height,
  }
}

export default function AlphaFitImage({ src, alt, className = '' }) {
  const [bounds, setBounds] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setBounds(null)
    setFailed(false)

    detectAlphaBounds(src)
      .then((nextBounds) => {
        if (!cancelled) setBounds(nextBounds)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => { cancelled = true }
  }, [src])

  if (failed) {
    return <img src={src} alt={alt} className={className} />
  }

  if (!bounds) {
    return <img src={src} alt={alt} className={className} />
  }

  const width = `${100 / bounds.contentW}%`
  const height = `${100 / bounds.contentH}%`
  const left = `${-(bounds.left / bounds.contentW) * 100}%`
  const top = `${-(bounds.top / bounds.contentH) * 100}%`

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        position: 'absolute',
        width,
        height,
        maxWidth: 'none',
        left,
        top,
      }}
    />
  )
}
