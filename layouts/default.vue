<script setup lang="ts">
import { type FormInstance, type FormRules, type TabsPaneContext } from 'element-plus'
import type { ChatTopic, Response, Result, SingleResult } from '~/types/response'
import type { LinToken } from '~/types/tokens'
import type { UserInfo } from '~/types/user'
import Http from '~/utils/http'

const appStore = useAppStore()
const userStore = useMyUserStore()
const chatStore = useChatStore()
const loginDialog = ref(true)
const isLogin = computed(() => userStore.getLogging)
watch(isLogin, (newValue, _oldValue) => {
  if (newValue)
    loginDialog.value = false
  else
    loginDialog.value = true
})
const { public: { apiBase } } = useRuntimeConfig()
let userInfo: UserInfo = { id: '', username: '', avatar: '', email: '', createTime: '' }
async function init() {
  const token = useCookie('lin-token')
  if (token.value) {
    userStore.setIsLogging(true)
    userStore.setToken(token.value)
  }
  if (userStore.getLogging) {
    const { data: result } = await useFetch(
  `${apiBase}/lin_chat/user/info`,
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
    const res = result.value as Response<SingleResult<UserInfo>>
    if (res && res.result && res.result.item) {
      userInfo = (result.value as Response<SingleResult<UserInfo>>).result.item
    }
    else {
      nextTick(() => {
        ElMessage.error('请登录哦！')
        userStore.setIsLogging(false)
        loginDialog.value = true
      })
    }
  }
}
onMounted(async () => {
  await init()
  if (userInfo) {
    userStore.setUserInfo(userInfo)
    const userId = useCookie('userId')
    userId.value = userInfo.id
  }
})

const formRef = ref<FormInstance>()
const userLogin = reactive({
  email: '',
  password: '',
})
const userLoginRule = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'change' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})
const loginLoading = ref(false)
// 处理登录表单
async function submitForm(formEl: FormInstance | undefined) {
  if (!formEl)
    return
  loginLoading.value = true
  await formEl.validate(async (valid) => {
    if (valid) {
      const http = new Http()
      await http.post(`${apiBase}/lin_chat/user/login`, userLogin).then((res) => {
        loginDialog.value = false
        const resp = res as Response<LinToken>
        userStore.setToken(resp.result['lin-token'].tokenValue)
        localStorage.setItem('lin-token', userStore.getToken)
        const token = useCookie('lin-token')
        token.value = userStore.getToken
        userStore.setUserInfoId(resp.result['lin-token'].loginId)
        userStore.setIsLogging(resp.result['lin-token'].isLogin)
        // 重置选中
        // 登录成功获取用户信息
        getUserInfo()
        // 获取主题
        getSubjectList()
      })
        .catch((_err) => {
        })
        .finally(() => {
          loginLoading.value = false
        })
    }
    else {
      ElMessage.error('请检查输入')
      loginLoading.value = false
      return false
    }
  })
}
// 获取用户信息
function getUserInfo() {
  const http = new Http()

  http.get(`${apiBase}/lin_chat/user/info`).then((res) => {
    const resp = res as Response<SingleResult<UserInfo>>
    userStore.setUserInfo(resp.result.item)
    userStore.setUserInfoId(resp.result.item.id)
    localStorage.setItem('userId', userStore.getUserInfo.id)
    const userId = useCookie('userId')
    userId.value = userStore.getUserInfo.id
  }).catch((err) => {
    switch (err.message) {
      case '401':
        loginDialog.value = true
        userStore.setIsLogging(false)
        nextTick(() => {
          ElMessage.error('请重新登录')
        })
        break
      default:
        break
    }
  })
}
// 获取主题列表
function getSubjectList() {
  const http = new Http()
  http.get(`${apiBase}/lin_chat/subject/subjects`).then((res) => {
    const resp = (res as Response<Result<ChatTopic>>).result.list
    chatStore.setSubjectList(resp)
  })
}
const register = reactive({
  email: '',
  username: '',
  password: '',
  validPassword: '',
  validCode: '',
  uuid: '',
})
const activeName = ref('login')
const formRefRegister = ref<FormInstance>()
const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: ['blur', 'change'] },
  ],
  validPassword: [
    { validator: validatePassword, required: true, trigger: ['blur', 'change'] },
  ],
  validCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
  ],
})
function validatePassword(_rule: any, value: string, callback: any) {
  if (value === '')
    callback(new Error('请输入确认密码'))

  else if (value !== register.password)
    callback(new Error('两次输入密码不一致'))

  else
    callback()
}
// 获取验证码图片
const captcha = ref('')
function getCaptcha() {
  const http = new Http()
  http.get(`${apiBase}/lin_chat/valid_code/image`).then((res) => {
    const resp = res as Response<SingleResult<string>>
    captcha.value = resp.result.item
    register.uuid = resp.result.uuid
  })
}
function handleClick(pane: TabsPaneContext, _ev: Event) {
  if (pane.paneName === 'register')
    getCaptcha()
}
// 处理注册表单
const registerLoading = ref(false)
async function submitRegister(formEl: FormInstance | undefined) {
  if (!formEl)
    return
  registerLoading.value = true
  await formEl.validate(async (valid) => {
    if (valid) {
      const http = new Http()
      await http.post(`${apiBase}/lin_chat/user/register`, register).then(() => {
        ElMessage.success('注册成功,邮箱已发送，请注意查收')
        userLogin.email = register.email
        userLogin.password = register.password
        activeName.value = 'login'
      }).catch(() => {
        registerLoading.value = false
      })
    }
    else {
      ElMessage.error('请检查输入')
    }
    registerLoading.value = false
  })
}
</script>

<template>
  <main class="flex text-center" overflow="hidden">
    <div class="menu inset-0 h-[100%] w-65 flex" :class="{ after: appStore.isExpanded }">
      <LazyAside />
    </div>
    <div class="content">
      <ChatHeader />
      <slot />
    </div>
    <!-- <Footer /> -->
  </main>

  <ClientOnly>
    <el-dialog
      v-model="loginDialog" title="登录注册"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      :show-close="false"
      center align-center
      class="w-90%! md:w-30%!"
    >
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane label="登录" name="login">
          <el-form ref="formRef" :model="userLogin" :rules="userLoginRule" label-width="auto" class="demo-ruleForm">
            <el-form-item
              label="邮箱" prop="email"
            >
              <el-input v-model="userLogin.email" autocomplete="off" />
            </el-form-item>
            <el-form-item
              label="密码" prop="password"
            >
              <el-input v-model="userLogin.password" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item>
              <el-button class="w-full" :loading="loginLoading" @click="submitForm(formRef)">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form ref="formRefRegister" :model="register" :rules="rules" status-icon label-width="auto" class="demo-ruleForm">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="register.email" autocomplete="off" />
            </el-form-item>
            <el-form-item label="用户名" prop="username">
              <el-input v-model="register.username" autocomplete="off" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="register.password" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item label="确认密码" prop="validPassword">
              <el-input v-model="register.validPassword" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item label="验证码" class="inlint" prop="validCode">
              <el-input v-model="register.validCode" autocomplete="off" />
              <img :src="captcha" alt="验证码" class="h-8 cursor-pointer" @click="getCaptcha">
            </el-form-item>
            <el-form-item>
              <el-button class="w-full" :loading="registerLoading" @click="submitRegister(formRefRegister)">
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </ClientOnly>
</template>

<style lang="postcss" scoped>
a {
  @apply duration-200 transition-colors text-sm p-3 border rounded-md gap-3 items-center cursor-pointer flex-shrink-0 mb-1 text-white hover: bg-dark-200
}

main {
  height: 100%;
}

.content {
  width: calc(100% - 16.25rem);
  transition: width 0.5s ease-out;
  /* 过渡动画 */
}

@media(max-width: 600px) {
  .content {
    width: 100%;
  }

  .menu {
    position: fixed;
    left: -16.25rem;
    width: 16.25rem;
    transition: left 0.5s ease-out;
    /* 过渡动画 */
    z-index: 1;
  }

  /*动态绑定样式*/
  .after {
    left: 0;
    width: 16.25rem;
  }
}
.demo-tabs > .el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.inlint :deep() .el-form-item__content{
  flex-wrap: inherit !important;
}
</style>
