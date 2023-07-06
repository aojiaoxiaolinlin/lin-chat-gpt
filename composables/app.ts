import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isExpanded: false,
    apiKeyFormStatus: false,

    dialogTableVisible: false,
  }),
  actions: {
    changeExpandStatus() {
      this.isExpanded = !this.isExpanded
    },
    changeApiKeyFormStatus() {
      this.apiKeyFormStatus = !this.apiKeyFormStatus
    },
    changePrompt() {
      this.dialogTableVisible = !this.dialogTableVisible
    },
  },
  getters: {
    getApiKeyFormStatus: state => state.apiKeyFormStatus,
    getPrompt: state => state.dialogTableVisible,
  },
})
