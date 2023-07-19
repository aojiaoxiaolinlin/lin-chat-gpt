<script setup lang="ts">
import type { DropdownInstance } from 'element-plus'
import type { MessageDTO, MessageRecord } from '~/types/communications'
import { ResultCode } from '~/types/result/resultCode'
import type { Response } from '~/types/response'
import Http from '~/utils/http'

// 发送的消息
const question = ref('')
// 处理输入命令
const dropdown1 = ref<DropdownInstance>()
const commands = ref(['/imgChat', '/imgMidj'])
// 获取输入框的DOM对象
const textInput = ref<HTMLInputElement | null>(null)
const chatStore = useChatStore()
const userStore = useMyUserStore()
const appStore = useAppStore()
// 定义Message对象用于发生Api请求
const messages = ref<MessageDTO>()
// 错误信息
const errorMessage = ref('')
const isError = ref<boolean>(false)

// 是否正在加载
const isLoading = ref(false)
// 生成uuid
let messageId = '0'
// 是否为修改消息
let isModify = false
// 是否为主体第一条消息
let isFirst = false
// 获取请求路径
const { public: { apiBase, chatMessage, modifyMessage } } = useRuntimeConfig()
// 用于终止请求
let controller: AbortController | any
let signal: AbortSignal | any
// 监听输入框高度变化
watch(() => question.value, () => {
  textInputHeight()
})
function textInputHeight() {
  nextTick(() => {
    if (textInput.value) {
      textInput.value.style.height = 'auto'
      textInput.value.style.height = `${textInput.value.scrollHeight}px`
    }
  })
}
// 选择
function selectPrompt(row: any) {
  question.value = row.prompt
  appStore.changePrompt()

  textInputHeight()
}
const getChatRecord = computed(() => chatStore.getChatMessage,
)
function newChat() {
  const subjectId = generateUUID()
  chatStore.addSubject({
    id: subjectId,
    title: '新对话',
    userId: '',
    createTime: '',
  })
  chatStore.setParentMessageId('0')
  chatStore.setSubjectId(subjectId)
}

function handleCommand(command: string) {
  question.value = `${command} `
}
// 异步发送消息
async function handlerSend() {
  isLoading.value = true
  // 除去空格
  const questionValue = question.value.trim()
  if (questionValue) {
    if (!chatStore.getSubjectId)
      newChat()

    if (chatStore.getParentMessageId === '0')
      isFirst = true

    // 加入消息列表
    addMessage(question.value.trim())
    if (isFirst)
      navigateTo(`${chatStore.getSubjectId}`)

    // 清空输入框
    question.value = ''
    // 发生消息数据处理
    // 发送请求
    await getCompletion()

    isModify = false
    isFirst = false
    // 判断是否是该主体的第一条消息，如果是则请求获取主题信息更新主题列表
    if (chatStore.getParentMessageId === '0' && !isError.value) {
      chatStore.addSubject({
        id: chatStore.getSubjectId,
        title: '新对话',
        userId: '',
        createTime: '',
      })
      getSubject()
    }
    chatStore.setParentMessageId(messageId)
  }
  else {
    isLoading.value = false
  }
}
function getSubject() {
  const http = new Http()
  http.get(`${apiBase}/lin_chat/subject/${chatStore.getSubjectId}`).then((res) => {
    chatStore.updateSubjectList(res.result.item)
  })
}
async function getCompletion() {
  try {
    // 选择Urls
    // 更改状态
    let url = apiBase
    if (isModify)
      url += modifyMessage
    else
      url += chatMessage

    controller = new AbortController()
    signal = controller.signal

    const completion = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.getToken}`,
      },
      method: 'POST',
      body: JSON.stringify(messages.value),
      signal,
    }).then((res) => {
      // 状态码判断
      switch (res.status) {
        case 200:
          errorMessage.value = ''
          return res
        case 401:
          errorMessage.value = '请输入apiKey'
          break
        case 429:
          errorMessage.value = '您超出了当前配额，请检查您的计划和账单明细'
          break
        case 500:
          errorMessage.value = '服务器出错'
          break
        default:
          errorMessage.value = '请求失败'
          break
      }

      isLoading.value = false
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e)
      isLoading.value = false
      errorMessage.value = '获取信息失败,超时请检查是否开启代理'
    })
    // 判断是否获取到数据
    if (completion) {
      // 获取读取器
      const reader = completion.body?.getReader()
      // 读取器是否获取成功
      if (!reader) {
        errorMessage.value = '获取信息失败'
        return
      }
      // 开始读取流s
      await read(reader, chatStore.chatMessage)
      errorMessage.value = ''
      isLoading.value = false
      handlerResponseMessage()
    }
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
}
function open(errorInfo: string) {
  ElMessageBox.alert(errorInfo, {
    confirmButtonText: '确认',
    type: 'error',
  })
}
function handlerInput(e: Event) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const value = e.target?.value
  if ((value as string).startsWith('/')) {
    commands.value = ['/imgChat', '/imgMidj'].filter((item) => {
      return item.includes(value)
    })
    if (dropdown1.value)
      dropdown1.value.handleOpen()
    if (commands.value.length === 0) {
      if (dropdown1.value)
        dropdown1.value.handleClose()
    }
  }
  else {
    commands.value = ['/imgChat', '/imgMidj']
    if (dropdown1.value)
      dropdown1.value.handleClose()
  }
}
function handlerRequest() {
  let url = apiBase
  if (question.value.startsWith('/img')) {
    if (question.value.startsWith('/imgChat'))
      console.log('chat')
    else if (question.value.startsWith('/imgMidj'))
      url += '/lin_chat/generate_image/midjourney'
    question.value = question.value.replace(/^\/img[a-zA-Z]*\s/, '')

    chatStore.addImage(
      {
        id: generateUUID(),
        content: question.value,
        role: 'user',
        subjectId: '0000',
        parentMessageId: '0000',
      },
      {
        id: '1111',
        prompt: question.value,
        imageId: '',
        imageUrl: '',
        model: 1,
        createTime: '',
      })
    const http = new Http()
    http.get(`${url}?prompt=${question.value}&modeType=1&generateSpeed=1`).then(() => {
      ElMessage.success('生成中...请稍后...')
    })
    question.value = ''
  }
  else {
    handlerSend()
  }
}

function handlerResponseMessage() {
  // 添加响应消息
  // 定位于最后一条消息
  isError.value = false
  const lastMessage = chatStore.getChatMessage[chatStore.getChatMessage.length - 1]
  if (isJsonStr(lastMessage.answer.content)) {
    isError.value = true
    const resp = JSON.parse(lastMessage.answer.content) as Response<Object>
    switch (resp.code) {
      case ResultCode.OPENAI_SSE_ERROR:
        open('服务器无法连接OpenAI,请稍后重试或联系管理员服务器错误')
        break
      case ResultCode.UNAUTHENTICATED:
        ElMessage.error(resp.message || '请重新登录')
        break
      case ResultCode.RATE_LIMIT:
        open('访问已达到限制:3次/分钟,请20s后再试' || '请重新登录')
        break
      default:
        ElMessage.error('请求失败,未知错误，请联系管理员')
    }
  }
}

// 添加消息-发送时的消息
function addMessage(question: string) {
  console.log('🚀 ~ file: QuestionInput.vue:279 ~ addMessage ~ isModify:', isModify)
  if (!isModify)
    messageId = generateUUID()
  messages.value = {
    id: messageId,
    role: 'user',
    content: question,
    subjectId: chatStore.getSubjectId,
    parentMessageId: chatStore.getParentMessageId,
    type: isModify ? 2 : (isFirst ? 0 : 1),
  }
  if (isModify) {
    // 修改chatRecord中当前index中question中的content
    chatStore.modifyChatRecord(messages.value.content, messageId)
  }
  else {
    // 加入对话列表
    const questionRecord: MessageRecord = {
      id: messageId,
      content: question,
      role: 'user',
      subjectId: chatStore.getSubjectId,
      parentMessageId: chatStore.getParentMessageId,
    }
    const answerRecord: MessageRecord = {
      id: generateUUID(),
      content: '',
      role: 'assistant',
      subjectId: chatStore.getSubjectId,
      parentMessageId: messageId,
    }
    chatStore.addChatRecord(questionRecord, answerRecord)
  }
}
async function handlerStopOrRestart() {
  // 是否在请求中
  if (isLoading.value) {
    controller.abort()
    isLoading.value = false
  }
  else {
    chatStore.clearLastMessage()
    isLoading.value = true
    // 重新请求
    if (messages.value) {
      messages.value.type = 1
      await getCompletion()
      handlerResponseMessage()
    }
    else if (chatStore.getChatMessage.length > 0) {
      messages.value = {
        id: chatStore.getChatMessage[chatStore.getChatMessage.length - 1].question.id,
        content: chatStore.getChatMessage[chatStore.getChatMessage.length - 1].question.id,
        role: 'user',
        subjectId: chatStore.getSubjectId,
        parentMessageId: chatStore.getParentMessageId,
        type: 1,
      }
      await getCompletion()
      handlerResponseMessage()
    }
    else { ElMessage.error('请先发送消息') }
  }
}
// 获取提示词
// 对话模态框
const prompts = ref([])
async function getPrompt() {
  const res = await $fetch('/api/prompts')
  prompts.value = res.prompts as []
}
</script>

<template>
  <!-- 停止生成 -->
  <div class="">
    <MyButton v-if="getChatRecord.length > 0" class="w-15 md:w-fit" @click="handlerStopOrRestart">
      {{ isLoading ? '停止' : '重新生成' }}
    </MyButton>
  </div>
  <div class="mb-10 w-4/5 flex flex-col items-start shadow-2xl">
    <ClientOnly>
      <el-dropdown ref="dropdown1" trigger="contextmenu" placement="top" @command="handleCommand">
        <span class="el-dropdown-link" />
        <template #dropdown>
          <el-dropdown-menu v-for="(item, index) in commands" :key="index">
            <el-dropdown-item :command="item">
              {{ item }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </ClientOnly>
    <div class="w-full flex items-end border-1 border-cool-gray-300 border-rd-2 px-2 py-1">
      <textarea
        ref="textInput"
        v-model="question"
        class="input mr-2 h-11 min-w-8/10 w-full border-width-2 border-gray-500 border-rd px-3 py-2 text-lg" rows="1"
        placeholder="请输入您的问题，使用“/img 生成图片”"
        autocomplete="on"
        @input="handlerInput"
        @keydown.enter.prevent="handlerRequest"
      />
      <button
        class="border-rd-md p-2" :disabled="question.length === 0 || errorMessage.length > 0"
        :style="(question.length === 0 || errorMessage.length > 0) ? 'bg-white' : 'background-color: rgb(25, 195, 125);s'"
        @click="handlerRequest"
      >
        <span>
          <svg v-if="!isLoading" t="1686995866451" class="h-7 w-7 md:m-0" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2386" width="200" height="200">
            <path
              d="M998.976 554.3232C1031.232 539.6032 1031.328 515.7952 998.976 501.0432L122.88 101.3312C90.624 86.6112 64.448 103.5072 64.384 138.4832L64 426.9952 773.568 527.6672 64 628.3392 64.384 916.8832C64.448 952.1152 90.528 968.7872 122.88 954.0352L998.976 554.3232Z"
              p-id="2387"
              :fill="(question.length === 0 || errorMessage.length > 0) ? '#bfbfbf' : '#FFFFFF'"
            /></svg>
          <Loading v-if="isLoading" />
        </span>
      </button>
    </div>
  </div>
  <ClientOnly>
    <el-dialog v-model="appStore.dialogTableVisible" title="提示词" @open="getPrompt">
      <el-table :data="prompts" stripe highlight-current-row height="400" @row-click="selectPrompt">
        <el-table-column align="center" property="act" label="角色" />
        <!-- <el-table-column align="center" property="prompt" label="提示词" width="200" /> -->
      </el-table>
    </el-dialog>
  </ClientOnly>
</template>

<style scoped>
.input {
  resize: none;
  border: none;
  outline: none;
}
</style>
