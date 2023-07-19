<script setup lang="ts">

</script>

<template>
  <div class="relative h-full flex py-3 dark:bg-dark-9">
    <!-- 聊天信息展示区 -->
    <ClientOnly>
      <NuxtPage />
    </ClientOnly>
    <!-- 输入区 -->
    <div class="absolute bottom-12 w-full flex justify-center md:flex-col md:items-center">
      <QuestionInput />
    </div>
  </div>
</template>

<style scoped>

</style>
