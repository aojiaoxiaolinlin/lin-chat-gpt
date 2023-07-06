<script setup lang="ts">
import type { Response, SingleResult } from '~/types/response'

definePageMeta({
  layout: 'home',
})
const { public: { apiBase } } = useRuntimeConfig()
const route = useRoute()
const email = route.query.email
const token = route.query.token

const { data: validResult } = await useFetch(
  `${apiBase}/lin_chat/valid_code/verifyEmail?email=${email}&token=${token}`,
  {
    method: 'GET',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    pick: ['message', 'code'],
  },
)
const result = (validResult.value as Response<SingleResult<null>>)
const router = useRouter()
function toLogin() {
  router.push('/hi/chat')
}
</script>

<template>
  <el-result
    v-if="result.code === 20000"
    icon="success"
    title="验证成功"
    sub-title="请前往登录"
  >
    <template #extra>
      <el-button type="primary" @click="toLogin">
        返回登录
      </el-button>
    </template>
  </el-result>

  <el-result
    v-else
    icon="error"
    title="验证失败"
    sub-title="请重新验证"
  >
    <template #extra>
      <el-button type="primary" @click="toLogin">
        返回注册
      </el-button>
    </template>
  </el-result>
</template>

<style scoped>

</style>
