/**
 * Generates a 9:16 Instagram Story card and triggers download.
 * Uses Canvas API — works entirely in-browser, no server needed.
 */
export async function exportStoryCard({ imageUrl, outfitName, styleName, styleIcon, tagline }) {
  const W = 1080
  const H = 1920

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Load the try-on image ──────────────────────────────────────
  const img = await loadImage(imageUrl)

  // Dark obsidian background
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, W, H)

  // Draw outfit image — centered, fill upper 78% of card
  const imgH = Math.round(H * 0.78)
  const imgW = W
  const scale = Math.max(imgW / img.width, imgH / img.height)
  const drawW = img.width * scale
  const drawH = img.height * scale
  const offsetX = (imgW - drawW) / 2
  const offsetY = 0
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

  // Gradient overlay — bottom fade to black
  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H)
  grad.addColorStop(0, 'rgba(8,8,8,0)')
  grad.addColorStop(0.55, 'rgba(8,8,8,0.85)')
  grad.addColorStop(1, 'rgba(8,8,8,1)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // ── Gold top accent line ───────────────────────────────────────
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, 'transparent')
  topGrad.addColorStop(0.3, '#c9a84c')
  topGrad.addColorStop(0.7, '#e8d5a3')
  topGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 3)

  // ── Style badge ────────────────────────────────────────────────
  const badgeY = H * 0.74
  ctx.save()
  ctx.fillStyle = 'rgba(201,168,76,0.15)'
  ctx.strokeStyle = 'rgba(201,168,76,0.6)'
  ctx.lineWidth = 2
  roundRect(ctx, W / 2 - 140, badgeY, 280, 60, 8)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#c9a84c'
  ctx.font = '500 28px "Arial", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${styleIcon}  ${styleName.toUpperCase()}`, W / 2, badgeY + 40)

  // ── Outfit name ────────────────────────────────────────────────
  ctx.fillStyle = '#f5f0e8'
  ctx.font = 'italic 300 72px Georgia, serif'
  ctx.textAlign = 'center'
  wrapText(ctx, outfitName, W / 2, H * 0.84, W - 120, 85)

  // ── Tagline ────────────────────────────────────────────────────
  if (tagline) {
    ctx.fillStyle = 'rgba(245,240,232,0.55)'
    ctx.font = '300 34px Arial, sans-serif'
    ctx.letterSpacing = '4px'
    ctx.textAlign = 'center'
    ctx.fillText(tagline, W / 2, H * 0.91)
  }

  // ── Kathy branding ─────────────────────────────────────────────
  // Crown symbol
  ctx.fillStyle = '#c9a84c'
  ctx.font = '28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('♛', W / 2, H * 0.955)

  ctx.fillStyle = '#c9a84c'
  ctx.font = 'italic 300 38px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('Kathy', W / 2, H * 0.967)

  ctx.fillStyle = 'rgba(201,168,76,0.5)'
  ctx.font = '300 22px Arial'
  ctx.letterSpacing = '6px'
  ctx.textAlign = 'center'
  ctx.fillText('ATELIER PRIVÉ', W / 2, H * 0.978)

  // ── Gold bottom accent line ────────────────────────────────────
  ctx.fillStyle = topGrad
  ctx.fillRect(0, H - 3, W, 3)

  // ── Download ───────────────────────────────────────────────────
  const blob = await canvasToBlob(canvas)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kathy-story-${styleName.toLowerCase().replace(' ', '-')}.jpg`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ── Helpers ────────────────────────────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.93))
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}
