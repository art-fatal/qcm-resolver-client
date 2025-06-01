<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NuxtPage />
    
    <!-- Navigation bar -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div class="max-w-screen-lg mx-auto flex justify-center space-x-4">
        <NuxtLink to="/" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Quiz
        </NuxtLink>
        <NuxtLink to="/raw-content" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          Contenu brut
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Layout principal de l'application
</script>
