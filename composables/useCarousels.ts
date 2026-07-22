export function initCarousels(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-carousel]').forEach((el) => {
    if (el.dataset.inited) return
    el.dataset.inited = '1'

    const track = el.querySelector('.carousel-track') as HTMLElement
    const slides = Array.from(track.children) as HTMLElement[]
    const prevBtn = el.querySelector('.carousel-arrow--prev') as HTMLButtonElement | null
    const nextBtn = el.querySelector('.carousel-arrow--next') as HTMLButtonElement | null
    const counter = el.querySelector('[data-current]') as HTMLElement | null

    let active = 0

    function setActive(idx: number) {
      active = Math.max(0, Math.min(idx, slides.length - 1))
      if (counter) counter.textContent = String(active + 1)
      if (prevBtn) prevBtn.disabled = active === 0
      if (nextBtn) nextBtn.disabled = active === slides.length - 1
    }

    function goTo(idx: number) {
      const clamped = Math.max(0, Math.min(idx, slides.length - 1))
      track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
      setActive(clamped) // не ждём scroll-события — реагируем сразу на клик
    }

    prevBtn?.addEventListener('click', () => goTo(active - 1))
    nextBtn?.addEventListener('click', () => goTo(active + 1))

    // Реальный источник истины — позиция скролла, а не IntersectionObserver:
    // синхронно работает и со свайпом, и со стрелками, и с драгом мышью.
    let scrollRaf: number | null = null
    track.addEventListener(
      'scroll',
      () => {
        if (scrollRaf) return
        scrollRaf = requestAnimationFrame(() => {
          const width = track.clientWidth
          if (width) setActive(Math.round(track.scrollLeft / width))
          scrollRaf = null
        })
      },
      { passive: true },
    )

    setActive(0)

    // Драг мышью — тач уже работает через нативный scroll-snap.
    let isDown = false
    let startX = 0
    let startScroll = 0

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return
      isDown = true
      track.classList.add('dragging')
      startX = e.clientX
      startScroll = track.scrollLeft
      track.setPointerCapture(e.pointerId)
    })
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return
      track.scrollLeft = startScroll - (e.clientX - startX)
    })
    const stopDrag = () => {
      if (!isDown) return
      isDown = false
      track.classList.remove('dragging')
      // довернуть до ближайшего слайда после ручного драга
      const width = track.clientWidth
      if (width) goTo(Math.round(track.scrollLeft / width))
    }
    track.addEventListener('pointerup', stopDrag)
    track.addEventListener('pointercancel', stopDrag)
  })
}
