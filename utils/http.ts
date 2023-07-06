import type { Response } from '~/types/response'
import { ResultCode } from '~/types/result/resultCode'

function fetch(url: string, options?: any): Promise<any> {
  // headers添加token
  let token = ''
  if (typeof localStorage !== 'undefined') {
    token = localStorage.getItem('lin-token') || ''
  }
  else {
    const accessToken = useCookie('lin-token')
    token = accessToken.value || ''
  }
  options.headers = {
    Authorization: `Bearer ${token}`,
  }
  const customApiKey = useCookie('accessToken')
  if (customApiKey.value)
    options.headers.CustomApiKey = `CustomApiKey ${customApiKey.value}`
  const {
    public: { apiBase },
  } = useRuntimeConfig() // 3.0正式版环境变量要从useRuntimeConfig里的public拿
  // 如果url前面有http或https,则不拼接apiBase
  let reqUrl = ''
  if (url.startsWith('http') || url.startsWith('https'))
    reqUrl = url
  else
    reqUrl = `${apiBase}${url}`

  // 不设置key，始终拿到的都是第一个请求的值，参数一样则不会进行第二次请求
  // const key = hash(JSON.stringify(options) + url)
  // const key = new Date().getTime()
  // options.key = key.toString()
  options.watch = false
  // 如果需要统一加参数可以options.params.token = 'xxx'
  return new Promise((resolve, reject) => {
    useFetch(reqUrl, options)
      .then(async ({ data, error }) => {
        if (error.value) {
          reject(error.value)
          return
        }
        const { value } = data
        if (!value) {
          // 这里处理你自定义的错误，例如code !== 1
          throw createError({
            statusCode: 500,
            statusMessage: reqUrl,
            message: '网络错误',
          })
        }
        switch ((value as any).code) {
          case ResultCode.SUCCESS:
            resolve(value)
            break
          case ResultCode.ERROR:
            await nextTick()
            ElMessage.error((value as Response<null>).message)
            reject(new Error((value as Response<null>).message))
            break
          case ResultCode.EMAIL_IS_EXISTS:
            await nextTick()
            ElMessage.error((value as Response<null>).message || '邮箱地址已被注册')
            reject(new Error((value as Response<null>).message || '邮箱地址已被注册'))
            break
          case ResultCode.VALID_CODE_EXPIRED:
            await nextTick()
            ElMessage.error((value as Response<null>).message || '验证码已过期')
            reject(new Error((value as Response<null>).message || '验证码已过期'))
            break
          case ResultCode.UNAUTHENTICATED:
            // const userStore = useUserStore()
            // 401处理
            nextTick(() => {
              ElMessage.error((value as Response<null>).message || '请登录')
            })
            reject(new Error((value as Response<null>).message || '请登录'))
            break
          case ResultCode.EMAIL_NOT_EXISTS:
            await nextTick()
            ElMessage.error((value as Response<null>).message || '邮箱地址不存在')
            reject(new Error((value as Response<null>).message || '邮箱地址不存在'))
            break
          case 403:
            // 403处理
            break
          case 404:
            // 404处理
            break
          case ResultCode.SERVER_ERROR:
            // 500处理
            await nextTick()
            ElMessage.error((value as Response<null>).message)
            reject(new Error((value as Response<null>).message))
            break
          default:
            break
        }
      })
      .catch((err: any) => {
        reject(err)
      })
  })
}

export default class Http {
  get = (url: string, params?: any) => {
    return fetch(url, { method: 'get', params })
  }

  post = (url: string, body?: any) => {
    return fetch(url, { method: 'post', body })
  }

  put = (url: string, body?: any) => {
    return fetch(url, { method: 'put', body })
  }

  delete = (url: string, body?: any) => {
    return fetch(url, { method: 'delete', body })
  }
}
