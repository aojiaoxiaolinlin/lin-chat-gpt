<script setup lang="ts">
const router = useRouter()
definePageMeta({
  layout: 'home',
})
function toIndex() {
  router.push('/')
}
</script>

<template>
  <main p="x4 y10" text="center teal-700 dark:gray-200">
    <div text-4xl>
      <div i-carbon-warning inline-block />
    </div>
    <div><h1>Lin-ChatGPT</h1></div>
    <div text-lg>
      <h1>基于OpenAI GPT-3.5的聊天机器人</h1>
      <div>
        <h1 class="text-9xl">
          404
        </h1>
        <h2>找不到页面</h2>
        <button text-sm btn m="3 t8" @click="toIndex">
          返回
        </button>
      </div>
    </div>
  </main>
</template>
