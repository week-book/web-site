import { marked } from 'marked'
import type { Token, Tokens } from 'marked'

// Возвращает список картинок из параграфа, если параграф состоит ТОЛЬКО
// из картинок и "пустоты" между ними (переносы строк/пробелы) — то есть
// не содержит никакого другого текста. Иначе — null.
function imagesOnly(token: Token): Tokens.Image[] | null {
  if (token.type !== 'paragraph') return null
  const p = token as Tokens.Paragraph
  const images: Tokens.Image[] = []

  for (const t of p.tokens) {
    if (t.type === 'image') {
      images.push(t as Tokens.Image)
    } else if (t.type === 'br') {
      continue
    } else if (t.type === 'text' && /^\s*$/.test((t as Tokens.Text).raw)) {
      continue // пустой текст/перенос строки — игнорируем
    } else {
      return null // есть настоящий текст — это не карусель
    }
  }

  return images.length ? images : null
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function renderCarousel(images: Tokens.Image[]): string {
  const slides = images
    .map((img) => {
      const caption = img.title
        ? `<span class="carousel-caption">${escapeAttr(img.title)}</span>`
        : ''
      return `<div class="carousel-slide"><img src="${img.href}" alt="${escapeAttr(img.text ?? '')}" loading="lazy" />${caption}</div>`
    })
    .join('')

  return `<div class="post-carousel" data-carousel>
    <div class="carousel-viewport">
      <div class="carousel-track">${slides}</div>
      <button class="carousel-arrow carousel-arrow--prev" data-dir="-1" aria-label="Предыдущее фото">‹</button>
      <button class="carousel-arrow carousel-arrow--next" data-dir="1" aria-label="Следующее фото">›</button>
      <div class="carousel-counter"><span data-current>1</span> / ${images.length}</div>
    </div>
  </div>`
}

export function renderPostBody(markdown: string): string {
  const tokens = marked.lexer(markdown)
  const out: string[] = []
  let i = 0

  while (i < tokens.length) {
    const imgs = imagesOnly(tokens[i])
    if (!imgs) {
      out.push(marked.parser([tokens[i]]))
      i++
      continue
    }

    // Собираем картинки из ЭТОГО параграфа + из всех последующих
    // параграфов, если они тоже "только картинки" (случай с пустой
    // строкой между ![]() — раньше это были отдельные параграфы).
    const group: Tokens.Image[] = [...imgs]
    i++
    while (i < tokens.length) {
      const next = imagesOnly(tokens[i])
      if (!next) break
      group.push(...next)
      i++
    }

    out.push(
      group.length >= 2
        ? renderCarousel(group)
        : `<p><img src="${group[0].href}" alt="${escapeAttr(group[0].text ?? '')}" /></p>`,
    )
  }

  return out.join('\n')
}
