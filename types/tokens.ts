export interface UsageTokens {
  promptTokens: number
  completionTokens: number
}

// login相关
export interface SAToken {
  isLogin: boolean
  loginDevice: string
  loginId: string
  loginType: string
  sessionTimeout: number
  tag: string
  tokenActivityTimeout: number
  tokenName: string
  tokenSessionTimeout: number
  tokenTimeout: number
  tokenValue: string
}

export interface LinToken {
  'lin-token': SAToken
}
