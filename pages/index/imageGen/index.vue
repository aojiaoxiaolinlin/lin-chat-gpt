<script setup lang="ts">
import { WebSocketBean } from 'tools-vue3'
import Http from '~/utils/http'

useHead({
  title: 'Midjourney图片生成',
  meta: [
    { hid: 'description', name: 'description', content: 'Midjourney图片生成页面，来这里生成你想要的图片' },
  ],
})
const chatStore = useChatStore()
const { public: { apiBase, wsBase } } = useRuntimeConfig()
let ws: WebSocketBean

const content = ref<HTMLDivElement | null>(null)
let observer: any = null
onMounted(() => {
  const http = new Http()
  chatStore.setMessageLoading(true)
  http.get(`${apiBase}/lin_chat/generate_image/get_images`).then((res) => {
    chatStore.setImageList(res.result.list)
    chatStore.setMessageLoading(false)
  }).catch(() => {
    chatStore.setMessageLoading(false)
  })

  const userId = useCookie('userId').value || localStorage.getItem('userId')
  const weSocketUrl = `${wsBase}/lin_chat/ws/generate_image/notification/${userId}`
  ws = new WebSocketBean({
    url: weSocketUrl,
    needReconnect: true,
    reconnectGapTime: 3000,
    heartSend: 'heartbeat',
    heartGet: 'heartbeat',
    onopen: () => {
      return Promise.resolve()
    },
    onerror: () => {
      ElMessage.error('连接失败,请重试')
    },
    onmessage: (messageEvent) => {
      const { data } = messageEvent
      if (data === 'heartbeat')
        return
      const { imageId, imageUrl, success, actions } = JSON.parse(data)
      if (success)
        chatStore.onReceiveMessage({ imageUrl, imageId, actions, createTime: new Date().toLocaleString() })
      else
        ElMessage.error('图片生成失败')
    },
  })
  setTimeout(() => {
    ws.start()
  }, 1000)

  // 滚动到底部
  setTimeout(() => {
    smoothScroll()
  }, 500)
  // 监控容器变化
  observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList')
        smoothScroll()
    }
  })
  // 启动监听
  observer.observe(content.value as HTMLElement, {
    childList: true,
    subtree: true,
  })
})
onBeforeUnmount(() => {
  ws.close()
})

function smoothScroll() {
  if (content.value) {
    const container = content.value
    const startY = container.scrollTop
    const targetY = container.scrollHeight - container.clientHeight
    const duration = 500 // 滚动动画持续时间

    const startTime = performance.now()
    const easeInOutQuad = (t: any) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const scroll = (currentTime: any) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = easeInOutQuad(progress)
      container.scrollTop = startY + (targetY - startY) * easeProgress

      if (progress < 1)
        requestAnimationFrame(scroll)
    }
    requestAnimationFrame(scroll)
  }
}
const getImages = computed(() => chatStore.getImageList)
function copy(content: string) {
  const clipboardObj = navigator.clipboard
  clipboardObj.writeText(content).then(() => {
    ElMessage.success('复制成功')
  })
}
const errorMessage = ref('')

// 对生成的图片进行操作
function handlerAction(imageId: string, act: string) {
  chatStore.addImage(
    { id: generateUUID(), content: `${act} : ${imageId}`, role: 'user', subjectId: '0000', parentMessageId: '0000' },
    { id: '1111', prompt: '', imageId, imageUrl: '', model: 1, createTime: '' })
  const http = new Http()
  http.get(`/lin_chat/generate_image/handler_image?imageId=${imageId}&action=${act}`)
    .then((res) => {
      ElMessage.success(res.result.message || '操作成功')
    }).catch((err) => {
      ElMessage.error(err.message || '操作失败')
    })
}
</script>

<template>
  <div
    ref="content"
    v-loading="chatStore.getMessageLoading"
    element-loading-text="加载中..." element-loading-background="rgba(122, 122, 122, 0.8)" class="myScroller mb-36 flex-1 overflow-y-auto"
  >
    <ul>
      <div v-for="(item, index) in chatStore.getImageList" :key="index" class="px-3 py-2">
        <!-- 问 -->
        <div class="question mb-2">
          <li
            class="mt-1.5 inline-block max-w-8/10 w-max rounded-lg bg-sky-500 px-3 py-2 text-left align-top text-warm-gray-100 dark:bg-gray-8"
          >
            {{ item.question.content }}
          </li>
          <div class="ml-1 inline-block h-8 w-8 overflow-hidden border-rd-9 align-top md:h-12 md:w-12">
            <img src="~/assets/images/head.jpg" alt="头像" srcset="">
          </div>
          <p class="mr-12 text-xs text-gray-400">
            {{ item.question.createTime }}
          </p>
        </div>
        <!-- 答 -->
        <div v-show="(index !== getImages.length - 1) || !errorMessage" text-left>
          <div class="inline-block h-10 w-10 overflow-hidden border-rd-9 align-top md:h-12 md:w-12">
            <!-- <img src="~/assets/svg/chatgpt.svg" alt="chatgpt"> -->
            <svg class="h-8 w-8 md:h-10 md:w-10" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" strokewidth="2">
              <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor" />
            </svg>
          </div>
          <li class="inline-block max-w-8/10 w-max rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark">
            <el-image :src="item.answer.imageUrl" :preview-src-list="[item.answer.imageUrl]" :alt="item.question.content" class="w-50 md:w-150">
              <template #error>
                <div class="image-slot">
                  <el-icon><ElIconPictureFilled /></el-icon>
                </div>
              </template>
            </el-image>
          </li>

          <ClientOnly>
            <el-dropdown class="custom-align">
              <span class="el-dropdown-link">
                <button class="i-carbon-overflow-menu-vertical align-bottom" />
              </span>
              <template #dropdown>
                <div>
                  <el-dropdown-menu>
                    <!-- <el-dropdown-item :icon="ReLoad" @click="handlerStopOrRestart()"> -->
                    <!-- 重新请求 -->
                    <!-- </el-dropdown-item> -->
                    <el-dropdown-item :icon="ElIconCopyDocument" @click="copy(item.answer.imageUrl)">
                      复制链接
                    </el-dropdown-item>
                    <template v-for="act in item.answer.actions" :key="act.index">
                      <el-dropdown-item :icon="ElIconPicture" @click="handlerAction(item.answer.imageId, act)">
                        {{ act }}
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </div>
              </template>
            </el-dropdown>
          </ClientOnly>

          <p class="ml-12 text-xs text-gray-400">
            {{ item.answer.createTime }}
          </p>
        </div>
      </div>
      <!-- error信息 -->
      <div v-if="errorMessage" class="w-full flex gap-4 border-rd-4 bg-gray-300 p-4 shadow-lg">
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0 stroke-current text-red" fill="none"
            viewBox="0 0 24 24" data-v-inspector="pages\index.vue:17:9" data-v-02281a80=""
          >
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              data-v-inspector="pages\index.vue:19:11" data-v-02281a80=""
            />
          </svg>
          <span class="text-red-500">{{ errorMessage }}</span>
        </div>
      </div>
    </ul>
  </div>
</template>

<style scoped>
.question {
  text-align: right;
}

.md-editor-preview-wrapper {
  padding: 0 !important;
}

.custom-align {
  vertical-align: bottom !important;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 30px;
}

.image-slot .el-icon {
  font-size: 30px;
}

.el-image__inner {
  width: 37.5rem !important;
}
</style>
