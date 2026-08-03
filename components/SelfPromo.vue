<script setup lang="ts">
const props = defineProps<{
  shareUrl: string
  shareDisplayUrl: string
  shareTitle?: string
}>()

const TELEGRAM_URL = 'https://t.me/weeekbook'

const shareState = ref<'idle' | 'copied'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

async function onShare() {
  const shareData = {
    title: props.shareTitle ?? 'Week-book',
    url: props.shareUrl,
  }

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share(shareData)
      return
    } catch {
      return
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(props.shareUrl)
      shareState.value = 'copied'
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        shareState.value = 'idle'
      }, 2000)
    } catch {
      // Clipboard API недоступен/запрещён — молча ничего не делаем.
    }
  }
}

onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<template>
  <div class="self-promo">
    <div class="self-promo__telegram">
      <div class="self-promo__qr" aria-hidden="true">
        <img src="/telegram-qr.svg" alt="" width="120" height="120" />
      </div>
      <div class="self-promo__telegram-text">
        <p class="self-promo__title">Больше историй в Telegram</p>
        <a class="self-promo__link" :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer">
          t.me/weeekbook
        </a>
      </div>
    </div>

    <div class="self-promo__share-block">
      <button type="button" class="self-promo__share" @click="onShare">
        {{ shareState === 'copied' ? 'Скопировано' : 'Поделиться' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.self-promo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 1.25rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  margin-top: 2rem;
}

.self-promo__telegram {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.self-promo__qr {
  flex-shrink: 0;
  color: var(--color-text, currentColor);
}

.self-promo__qr img {
  display: block;
  width: 72px;
  height: 72px;
}

.self-promo__title {
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.self-promo__link {
  color: inherit;
  opacity: 0.75;
  text-decoration: none;
}

.self-promo__link:hover {
  text-decoration: underline;
}

.self-promo__share-block {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.self-promo__share-url {
  font-size: 0.85rem;
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.self-promo__share {
  flex-shrink: 0;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-text);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.self-promo__share:hover {
  opacity: 0.85;
}

/* На мобильном QR не нужен (сканировать нечем), но раньше это оставляло
   пустое место справа из-за space-between — теперь блок целиком в колонку. */
@media (max-width: 640px) {
  .self-promo {
    flex-direction: column;
    align-items: stretch;
  }

  .self-promo__qr {
    display: none;
  }

  .self-promo__share-block {
    justify-content: space-between;
  }

  .self-promo__share {
    flex: 1;
  }
}
</style>
