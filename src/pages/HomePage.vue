<template>
  <div class="home-page">
    <h1>{{ $t('home.title') }}</h1>
    <p>{{ $t('home.welcome') }}</p>
  </div>
</template>

<script setup>
// Компонент домашней страницы
</script>

<style scoped>
.home-page {
  padding: 2rem;
}

h1 {
  margin-bottom: 1rem;
  color: var(--p-primary-500);
}
</style>
