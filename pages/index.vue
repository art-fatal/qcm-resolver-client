<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 flex items-center justify-center p-1 md:p-4">
      <div class="w-full lg:w-1/2 bg-white rounded-lg shadow-lg md:p-6 p-1">
        <h1 class="text-lg md:text-2xl font-bold mb-4 md:mb-6">Quiz en temps réel</h1>
        <QuizDisplay />
      </div>
      <Toast />
    </div>
  </div>
</template>

<script setup lang="ts">
// Le composant QuizDisplay sera automatiquement importé par Nuxt
</script> 