<script setup lang="ts">

</script>

<template>
  <div p="x4 y10" text="dark:gray-200 7xl" w-full>
    <p class="title">
      基于OpenAI GPT-3.5的聊天AI
    </p>
  </div>
</template>

<style scoped>
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.title {
  background: -webkit-linear-gradient(left, #FBC2EB, #A6C1EE);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 5s ease infinite;
}
</style>
