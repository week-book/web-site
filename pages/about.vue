<script setup lang="ts">
useSeoMeta({
  title: 'О себе',
  description: 'Немного о Синицком Даниле — авторе блога Week-book',
  ogTitle: 'О себе — Week-book',
  ogDescription: 'Немного о Синицком Даниле — авторе блога Week-book',
})
</script>

<template>
  <article class="about">
    <h1 class="about__title">О себе</h1>

    <p>
      Всем привет! Меня зовут Данил.<br>Cейчас я работаю программистом.
    </p>

    <p>
      Всё время, что я себя помню, меня тянуло заниматься всевозможной
      творческой деятельностью. Были времена, когда я вязал
      одежду, думал попробовать себя в шелкографии и написании музыки.
    </p>

    <p>
      Прямо сейчас пробую вырастить перец на балконе — посмотрим, что из этого выйдет.
    </p>

    <p>
      Я думаю, программирование для меня нечто большее,
      чем нолики и единицы — это ещё один из способов проявить себя творчески.
    </p>

    <p>
      Мне кажется, соцсети сосут. В какой-то момент подметил, что все они по сути одинаковые и
      их задача сводится к одному: заставить тебя проводить как можно больше времени в них, чтобы
      показать тебе как можно больше рекламы.
    </p>

    <p>
      Это и не плохо, и не хорошо, но время от времени
      я замечаю, что очень сильно устаю от всего этого. Поэтому мне захотелось создать свой
      небольшой кусочек свободы, креативности и простоты в интернете!
    </p>

    <p>
      Этот сайт пока ещё очень молодой, тут пока нет ничего, кроме возможности читать посты, но
      он мне очень нравится и у меня довольно большие планы и идеи, что можно было бы добавить
      сюда. Надеюсь, вам полюбится это местечко так же, как и мне, и вы будете время от времени
      заходить сюда.
    </p>

    <p class="about__schedule">
      Посты выходят в нечётные будние дни — по понедельникам, средам и пятницам.
    </p>

    <footer class="about__footer">
      <p>
        Написать мне:
        <a href="mailto:dekter13@gmail.com?subject=Веб-сайт">dekter13@gmail.com</a>
      </p>
      <p>
        Исходный код блога открыт:
        <a href="https://github.com/week-book" target="_blank" rel="noopener">GitHub</a>
      </p>
    </footer>
  </article>
</template>

<style scoped>
.about {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem;
  line-height: 1.75;
}

.about__title {
  margin-bottom: 1.5rem;
}

.about p {
  margin-bottom: 1.25rem;
}

.about__schedule {
  font-style: italic;
  opacity: 0.75;
}

.about__footer {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  font-size: 0.95rem;
}

.about__footer p {
  margin-bottom: 0.5rem;
}

.about__footer a {
  color: inherit;
  text-underline-offset: 3px;
}
</style>

