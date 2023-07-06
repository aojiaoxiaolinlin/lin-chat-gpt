<script setup lang="ts">
import '~/assets/css/scroller.css'
import { MdPreview } from 'md-editor-v3'
import type { DropdownInstance, FormInstance } from 'element-plus'
import type { MessageDTO, RecordList } from '~/types/communications'
import 'md-editor-v3/lib/preview.css'
import Http from '~/utils/http'
import { useMyUserStore } from '~/composables/myUser'
import ReLoad from '~/components/ReLoad.vue'
import { ResultCode } from '~/types/result/resultCode'
import type { Response } from '~/types/response'
import { isJsonStr } from '~/utils/strUtil'

// apiKey
// const { public: { apiKey } } = useRuntimeConfig()
const formValue = reactive({
  apiKey: '',
})
const formRef = ref<FormInstance>()
const appStore = useAppStore()
// 提交表单
async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl)
    return
  await formEl.validate(async (valid) => {
    if (valid) {
      const accessToken = useCookie('accessToken')
      accessToken.value = formValue.apiKey
      const res = await getBill()
      if (res) {
        ElMessage.success(`openai用户:${res.subscription.account_name}`)
        appStore.changeApiKeyFormStatus()
        localStorage.setItem('apiKey', formValue.apiKey)
      }
    }
  })
}
// 验证apiKey
async function getBill() {
  const http = new Http()
  return await http.get('/chat/apiKey').then((res) => {
    if (res.code === 401) {
      ElMessage.error(res.message)
      return false
    }
    return res.result
  })
}
// 发送的消息
const question = ref('')
// 展示对话数据
const recordList = reactive<RecordList>({
  items: [],
})
// recordList.items = [{ question: { id: '0', content: '/imgMidj a beautiful cat' }, delta: { role: 'assistant', content: 'https://midjourney.cdn.zhishuyun.com/attachments/1117962980529819762/1126295341541621880/Adoghma_a_beautiful_cat_taskd298a5b8-589a-4f8d-bb4d-ac2f65e0178_50e42afd-41d0-44f5-939c-8e2730eadafa.png' }, usageTokens: { completionTokens: 0, promptTokens: 0 } }]
// 获取数据用于展示
const getRecordList = computed(() => {
  return [...recordList.items]
})
// 定义Message对象用于发生Api请求
const messages = ref<MessageDTO>()
// 是否正在加载
const isLoading = ref(false)
// 获取输入框的DOM对象
const textInput = ref<HTMLInputElement | null>(null)
// 错误信息
const errorMessage = ref('')
const isError = ref<boolean>(false)
const chatStore = useChatStore()
// 生成uuid
let messageId = '0'
// 是否为修改消息
let isModify = false
// 是否为主体第一条消息
let isFirst = false

function scroller() {
  nextTick(() => {
    if (textInput.value) {
      textInput.value.style.height = 'auto'
      textInput.value.style.height = `${textInput.value.scrollHeight}px`
    }
  })
}
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
  chatStore.setActive(0)
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
    handlerRequest()
    addMessage(question.value.trim())
    // 清空输入框
    question.value = ''
    // 发生消息数据处理
    // 发送请求
    // await getCompletion()

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
      chatStore.setActive(0)
    }
    chatStore.setParentMessageId(messageId)
  }
  else {
    isLoading.value = false
  }
}
function handlerRequest() {
  console.log('handlerRequest', question.value)

  if (question.value.startsWith('/img')) {
    if (question.value.startsWith('/imgChat'))
      console.log('chat')
    else if (question.value.startsWith('/imgMidj'))
      console.log('midj')
    question.value = question.value.replace(/^\/img[a-zA-Z]*\s/, '')
  }
  else { console.log('other') }
  console.log(question.value)
}
function handlerResponseMessage() {
  // 添加响应消息
  // 定位于最后一条消息
  isError.value = false
  const lastMessage = recordList.items[recordList.items.length - 1]
  if (isJsonStr(lastMessage.delta.content)) {
    isError.value = true
    const resp = JSON.parse(lastMessage.delta.content) as Response<Object>
    switch (resp.code) {
      case ResultCode.OPENAI_SSE_ERROR:
        open('服务器无法连接OpenAI,请稍后重试或联系管理员服务器错误')
        break
      case ResultCode.UNAUTHENTICATED:
        ElMessage.error(resp.message || '请重新登录')
        break
      case ResultCode.RATE_LIMIT:
        open('访问已达到限制：3次/分钟，请20s后再试' || '请重新登录')
        break
      default:
        ElMessage.error('请求失败,未知错误，请联系管理员')
    }
  }
  // 计算tokens
  recordList.items[recordList.items.length - 1].usageTokens.completionTokens = computeTokens(lastMessage.delta.content)
}
function open(errorInfo: string) {
  ElMessageBox.alert(errorInfo, {
    confirmButtonText: '确认',
    type: 'error',
  })
}
// 添加消息-发送时的消息
function addMessage(question: string) {
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
    let index = 0
    for (let i = 0; i < recordList.items.length; i++) {
      if (recordList.items[i].question.id === messageId) {
        index = i
        break
      }
    }
    // 修改recordList中当前index中question中的content
    recordList.items[index].question.content = messages.value.content
    // 删除recordList中当前index中delta中的content内容
    recordList.items[index].delta.content = ''
    // 删除recordList中index后所有元素
    recordList.items.splice(index + 1, recordList.items.length - index - 1)
  }
  else {
    // 加入对话列表
    recordList.items.push({
      question: {
        id: messageId,
        content: messages.value.content,
      },
      delta: {
        role: 'assistant',
        content: '',
      },
      usageTokens: { promptTokens: computeTokens(question), completionTokens: 0 },
    })
  }
  scroller()
}
// 获取主题信息
function getSubject() {
  const http = new Http()
  http.get(`/lin_chat/subject/${chatStore.getSubjectId}`).then((res) => {
    chatStore.updateSubjectList(res.result.item)
  })
}
// 获取请求路径
const { public: { apiBase, chatMessage, modifyMessage } } = useRuntimeConfig()
// 用于终止请求
let controller: AbortController | any
let signal: AbortSignal | any
const userStore = useMyUserStore()
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
      await read(reader, recordList)
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
// 监听输入框高度变化
watch(() => question.value, () => {
  if (textInput.value) {
    textInput.value.style.height = 'auto'
    textInput.value.style.height = `${textInput.value.scrollHeight}px`
  }
})
const content = ref<HTMLDivElement | null>(null)

const id = 'preview-only'
const getChatRecord = computed(() => {
  return chatStore.getChatRecord
})
watch(() => getChatRecord.value, () => {
  // 首先清空
  recordList.items = []
  for (let i = 0; i < getChatRecord.value.length;) {
    if (!getChatRecord.value[i + 1])
      break
    recordList.items.push({
      question: {
        content: getChatRecord.value[i].content,
        id: getChatRecord.value[i].id,
        recordTime: getChatRecord.value[i].recordTime,
      },
      delta: {
        role: 'assistant',
        content: getChatRecord.value[i + 1].content,
      },
      usageTokens: { promptTokens: computeTokens(getChatRecord.value[i].content), completionTokens: computeTokens(getChatRecord.value[i + 1].content) },
    })
    i += 2
  }
  // 最后一项的id给parentMessageId
  if (getChatRecord.value.length > 0)
    chatStore.setParentMessageId(getChatRecord.value[getChatRecord.value.length - 1].id)
  setTimeout(() => {
    if (content.value)
      content.value.scrollTop = content.value.scrollHeight
  }, 200)
}, {
  deep: true,
})
// 监控content高度
watch(
  () => recordList,
  () => {
    nextTick(() => {
      if (content.value)
        content.value.scrollTop = content.value.scrollHeight
    })
  },
  {
    deep: true,
  },
)
// 数据缓存
onMounted(() => {

})
async function handlerStopOrRestart() {
  // 是否在请求中
  if (isLoading.value) {
    controller.abort()
    isLoading.value = false
  }
  else {
    recordList.items[recordList.items.length - 1].delta.content = ''
    isLoading.value = true
    // 重新请求
    if (messages.value) {
      messages.value.type = 2
      await getCompletion()
      handlerResponseMessage()
    }
    else if (recordList.items.length === chatStore.getChatRecord.length / 2) {
      messages.value = {
        id: chatStore.getChatRecord[chatStore.getChatRecord.length - 2].id,
        content: chatStore.getChatRecord[chatStore.getChatRecord.length - 2].content,
        role: 'user',
        subjectId: chatStore.getSubjectId,
        parentMessageId: chatStore.getParentMessageId,
        type: 2,
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
// 选择
function selectPrompt(row: any) {
  question.value = row.prompt
  appStore.changePrompt()

  nextTick(() => {
    if (textInput.value) {
      textInput.value.style.height = 'auto'
      textInput.value.style.height = `${textInput.value.scrollHeight}px`
    }
  })
}
function modifyQuestion(id: string, myQuestion: string) {
  question.value = myQuestion
  messageId = id
  isModify = true
}
function copy(content: string) {
  const clipboardObj = navigator.clipboard
  clipboardObj.writeText(content).then(() => {
    ElMessage.success('复制成功')
  })
}
// 处理输入命令
const dropdown1 = ref<DropdownInstance>()
const commands = ref(['/imgChat', '/imgMidj'])

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
function handleCommand(command: string) {
  question.value = `${command} `
}
</script>

<template>
  <div class="relative h-full flex py-3 dark:bg-dark-9">
    <!-- 聊天信息展示区 -->
    <div
      v-if="(recordList.items.length > 0)" ref="content"
      v-loading="chatStore.getMessageLoading"
      element-loading-text="加载中..." element-loading-background="rgba(122, 122, 122, 0.8)" class="myScroller mb-36 flex-1 overflow-y-auto"
    >
      <ul>
        <div v-for="(item, index) in getRecordList" :key="index" class="px-3 py-2">
          <!-- 问 -->
          <div class="question mb-2">
            <el-dropdown class="custom-align">
              <span class="el-dropdown-link">
                <button class="i-carbon-overflow-menu-vertical align-bottom" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="ElIconEdit" @click="modifyQuestion(item.question.id, item.question.content)">
                    修改
                  </el-dropdown-item>
                  <el-dropdown-item :icon="ElIconCopyDocument" @click="copy(item.question.content)">
                    复制
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <li
              class="mt-1.5 inline-block max-w-8/10 w-max rounded-lg bg-sky-500 px-3 py-2 text-left align-top text-warm-gray-100 dark:bg-gray-8"
            >
              {{ item.question.content }}
            </li>
            <div class="ml-1 inline-block h-8 w-8 overflow-hidden border-rd-9 align-top md:h-12 md:w-12">
              <img src="~/assets/images/head.jpg" alt="头像" srcset="">
            </div>
            <p class="mr-12 text-xs text-gray-400">
              token消耗:
              <CountTo :start-val="0" :end-val="item.usageTokens.promptTokens" :duration="1000" />
            </p>
          </div>
          <!-- 答 -->
          <div v-show="(index !== recordList.items.length - 1) || !errorMessage" text-left>
            <div class="inline-block h-10 w-10 overflow-hidden border-rd-9 align-top md:h-12 md:w-12">
              <!-- <img src="~/assets/svg/chatgpt.svg" alt="chatgpt"> -->
              <svg class="h-8 w-8 md:h-10 md:w-10" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" strokewidth="2">
                <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor" />
              </svg>
            </div>
            <li class="inline-block max-w-8/10 w-max rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark">
              <MdPreview :editor-id="id" :model-value="item.delta.content" theme="light" class="border-rd-2" />
              <!-- <el-image :src="item.delta.content" :preview-src-list="[item.delta.content]" alt="" w-200 /> -->
            </li>

            <el-dropdown class="custom-align">
              <span class="el-dropdown-link">
                <button class="i-carbon-overflow-menu-vertical align-bottom" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="ReLoad" @click="handlerStopOrRestart()">
                    重新请求
                  </el-dropdown-item>
                  <el-dropdown-item :icon="ElIconCopyDocument" @click="copy(item.delta.content)">
                    复制
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <p class="ml-12 text-xs text-gray-400">
              token消耗:
              <CountTo :start-val="0" :end-val="item.usageTokens.completionTokens" :duration="1000" />
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
    <div v-else p="x4 y10" text="dark:gray-200 7xl" w-full>
      <p class="title">
        基于OpenAI GPT-3.5的聊天AI
      </p>
    </div>
    <!-- 输入区 -->
    <div class="absolute bottom-12 w-full flex justify-center md:flex-col md:items-center">
      <!-- 停止生成 -->
      <div class="">
        <MyButton v-if="recordList.items.length > 0" class="w-15 md:w-fit" @click="handlerStopOrRestart">
          {{ isLoading ? '停止' : '重新生成' }}
        </MyButton>
      </div>
      <div class="wrapper mb-10 w-4/5 flex flex-col items-start">
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
          />
          <button
            class="border-rd-md p-2" :disabled="question.length === 0 || errorMessage.length > 0"
            :style="(question.length === 0 || errorMessage.length > 0) ? 'bg-white' : 'background-color: rgb(25, 195, 125);s'"
            @click="handlerSend"
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
    </div>
  </div>
  <ClientOnly>
    <el-dialog v-model="appStore.apiKeyFormStatus" title="请输入您的ApiKey" align-center>
      <el-form ref="formRef" :model="formValue" label-width="70px" class="demo-ruleForm">
        <el-form-item
          label="ApiKey" prop="apiKey" :rules="[
            { required: true, message: '请输入apiKey' },
          ]"
        >
          <el-input v-model="formValue.apiKey" type="password" autocomplete="off" />
        </el-form-item>
        <el-form-item>
          <el-button btn @click="submitForm(formRef)">
            提交
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </ClientOnly>

  <ClientOnly>
    <el-dialog v-model="appStore.dialogTableVisible" title="提示词" @open="getPrompt">
      <el-table :data="prompts" stripe highlight-current-row height="400" @row-click="selectPrompt">
        <el-table-column align="center" property="act" label="角色" />
        <!-- <el-table-column align="center" property="prompt" label="提示词" width="200" /> -->
      </el-table>
    </el-dialog>
  </ClientOnly>
</template>

<style lang="postcss" scoped>
.question {
  text-align: right;
}

.el-button:focus,
.el-button:hover {
  color: white;
  background-color: black;
}

.fixed-bottom {
  /* 水平居中 */
  position: absolute;
  bottom: 3rem;
  @apply flex justify-center
}

@media(max-width: 600px) {}

@media(min-width: 600px) {}

.wrapper {
  @apply shadow-2xl
}

.input {
  resize: none;
  border: none;
  outline: none;
}

.md-editor-preview-wrapper {
  padding: 0 !important;
}

.custom-align {
  vertical-align: bottom !important;
}

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

.example-showcase .el-dropdown-link {
  color: var(--el-color-primary);
  z-index: 999;
}
</style>
