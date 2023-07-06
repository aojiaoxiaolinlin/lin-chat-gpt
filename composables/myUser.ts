import { defineStore } from 'pinia'
import type { UserInfo } from '~/types/user'

export const useMyUserStore = defineStore('myUser', {
  state: () => ({
    userInfo: {} as UserInfo,
    token: '',
    isLogging: false,
  }),
  actions: {
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
    },
    setUserInfoId(id: string) {
      this.userInfo.id = id
    },
    setToken(token: string) {
      this.token = token
    },
    setIsLogging(isLogging: boolean) {
      this.isLogging = isLogging
    },
  },
  getters: {
    getUserInfo: state => state.userInfo,
    getToken: state => state.token,
    getLogging: state => state.isLogging,
  },

})
