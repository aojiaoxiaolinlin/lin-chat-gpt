import { defineStore } from 'pinia'
import type { MessagesStore, RecordListStore } from '~/types/communications'

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [] as MessagesStore[],
    recordLists: [] as RecordListStore[],
  }),
  actions: {
    addMessage(message: MessagesStore) {
      this.messages.push(message)
    },
    addRecordList(recordList: RecordListStore) {
      // 遍历recordLists，如果有相同id的，就更新，否则就添加
      const index = this.recordLists.findIndex(item => item.id === recordList.id)
      if (index !== -1)
        this.recordLists[index] = recordList
      else
        this.recordLists.push(recordList)
    },
    removeMessage(id: string) {
      // 根据id删除
      this.messages = this.messages.filter(item => item.id !== id)
    },
  },
  getters: {
    getRecords: state => (id: string) => state.recordLists.find(item => item.id === id)?.recordList || [],
  },
})
