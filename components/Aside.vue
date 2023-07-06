<script setup lang="ts">
import '~/assets/css/scroller.css'
import type { ChatTopic, Response, Result } from '~/types/response'
import Http from '~/utils/http'

const appStore = useAppStore()
const userStore = useMyUserStore()
const chatStore = useChatStore()
const { public: { apiBase } } = useRuntimeConfig()

let subjects: ChatTopic[] = []
const subjectId = useCookie('subjectId')
const loading = ref(false)
// await init()
async function init() {
  if (userStore.getLogging) {
    loading.value = true
    // 获取当前用户聊天主题记录
    const token = useCookie('lin-token')
    const { data: subjectResult } = await useFetch(
  `${apiBase}/lin_chat/subject/subjects`,
  {
    method: 'GET',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    pick: ['result'],
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  },
    )
    subjects = (subjectResult.value as Response<Result<ChatTopic>>).result.list
    loading.value = false
  }
}

onMounted(async () => {
  await init()

  chatStore.setSubjectList(subjects as ChatTopic[])

  if (userStore.getLogging)
    getMessageOnFlash()
  // 读取本地缓存
  chatStore.setActive(Number(localStorage.getItem('active')) >= 0 ? Number(localStorage.getItem('active')) : -1)
  window.onbeforeunload = () => {
    // localStorage.setItem('subjectId', chatStore.getSubjectId)
    localStorage.setItem('active', chatStore.getActive.toString())
    const subjectId = useCookie('subjectId')
    subjectId.value = chatStore.getSubjectId
  }
})
function getMessageOnFlash() {
  // const subjectId = localStorage.getItem('subjectId')
  if (subjectId.value) {
    chatStore.setMessageLoading(true)
    chatStore.setSubjectId(subjectId.value)
    const http = new Http()
    http.get(`${apiBase}/lin_chat/message/messages/${subjectId.value}`).then((res) => {
      chatStore.setChatRecord(res.result.list)
      chatStore.setMessageLoading(false)
    })
  }
}
chatStore.setSubjectList(subjects as ChatTopic[])
function newChat() {
  const subjectId = generateUUID()

  chatStore.setParentMessageId('0')
  chatStore.setSubjectId(subjectId)
  chatStore.setChatRecord([])
  chatStore.setActive(-1)
}
function closeMenu() {
  appStore.changeExpandStatus()
}
function deleteMessage(id: string) {
  // 删除数据
  const http = new Http()
  loading.value = true
  http.delete(`${apiBase}/lin_chat/subject/${id}`).then(() => {
    // 更新subject
    http.get(`${apiBase}/lin_chat/subject/subjects`).then((res) => {
      chatStore.setSubjectList(res.result.list)
      loading.value = false
    })
  })
  chatStore.setActive(-1)
  chatStore.setChatRecord([])
  chatStore.setParentMessageId('0')
  chatStore.setSubjectId('')
}
function openDialog() {
  appStore.changeApiKeyFormStatus()
}
function getPrompt() {
  appStore.changePrompt()
}
// 选择聊天主题获取对应的聊天记录
function selectChatSubject(id: string, index: number) {
  chatStore.setActive(index)
  chatStore.setMessageLoading(true)
  const http = new Http()
  http.get(`${apiBase}/lin_chat/message/messages/${id}`).then((res) => {
    chatStore.setChatRecord(res.result.list)
    chatStore.setMessageLoading(false)
  })
  chatStore.setSubjectId(id)
}

// const svg = loadingSVG
</script>

<template>
  <div class="h-full w-full flex flex-col translate-x-0 border border-gray-800 bg-dark">
    <div class="relative h-full w-full flex-1">
      <nav class="h-full w-full flex flex-col p-2">
        <div>
          <a class="flex flex-row" @click="newChat">
            <div i="carbon-add" /> <span>新对话</span>
          </a>
        </div>
        <!-- 聊天记录开始 -->
        <div class="w-full flex flex-col overflow-y-auto">
          <span class="text-xl font-400 text-warm-gray-100">聊天记录</span>
          <div
            v-loading="loading"
            element-loading-text="加载中..."
            element-loading-background="rgba(122, 122, 122, 0.8)"
            class="myScroller w-full flex flex-col overflow-y-auto"
          >
            <!-- 将a中的两个标签水平对齐 -->
            <a v-for="(item, index) in chatStore.getSubjectList" :key="item.id" class="flex flex-row items-center justify-between" :class="index === chatStore.getActive ? 'active' : ''" :title="item.title" @click="selectChatSubject(item.id, index)">
              <div i="carbon-chat" />
              <span>{{ item.title }}</span>
              <button class="text-gray-400 hover:text-gray-50" @click.stop="deleteMessage(item.id)">
                <div i="carbon-trash-can" />
              </button>
            </a>
          </div>
          <el-divider m-1 h-1 />
        </div>
        <!-- 聊天记录结束 -->
        <!-- 图片生成 -->
        <div class="mb-26 w-full flex flex-col overflow-y-auto">
          <span class="text-xl font-400 leading-12 text-warm-gray-100">图片生成</span>
          <div
            v-loading="loading"
            element-loading-text="加载中..."
            element-loading-background="rgba(122, 122, 122, 0.8)"
            class="myScroller w-full flex flex-col overflow-y-auto"
          >
            <!-- 将a中的两个标签水平对齐 -->
            <a v-for="(item, index) in chatStore.getSubjectList" :key="item.id" class="flex flex-row items-center justify-between" :class="index === chatStore.getActive ? 'active' : ''" :title="item.title" @click="selectChatSubject(item.id, index)">
              <div i="carbon-chat" />
              <span>{{ item.title }}</span>
              <button class="text-gray-400 hover:text-gray-50" @click.stop="deleteMessage(item.id)">
                <div i="carbon-trash-can" />
              </button>
            </a>
          </div>
          <el-divider m-1 h-1 />
        </div>
        <!-- 聊天记录结束 -->
        <!-- 功能区开始 -->
        <div class="absolute bottom-2 w-9/10 flex flex-col items-center">
          <a class="w-9/10 text-white" @click="getPrompt"><span>提示词</span></a>
          <a class="w-9/10" round @click="openDialog">
            输入Key
          </a>
        </div>
        <!-- 功能区结束 -->
      </nav>
    </div>
  </div>
  <div>
    <button v-if="appStore.isExpanded" @click="closeMenu">
      <div bg-gray-4 i="carbon-close-outline" />
    </button>
  </div>
</template>

<style lang="postcss" scoped>
a {
  @apply duration-200 transition-colors text-sm p-3 border border-cool-gray-400 rounded-md gap-3 items-center cursor-pointer flex-shrink-0 mb-1 text-white hover:bg-dark-200;
}

.active {
  @apply bg-dark-100;
}
</style>
