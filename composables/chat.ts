import { defineStore } from 'pinia'
import type { MessageRecord } from '~/types/communications'
import type { ChatTopic, Image } from '~/types/response'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatRecord: [] as MessageRecord[],
    subjectId: '' as string,
    parentMessageId: '0' as string,
    subjectList: [] as ChatTopic[],
    active: -1,
    messagesLoading: false,
    imageList: [] as Image[],
  }),
  actions: {
    setChatRecord(record: any[]) {
      this.chatRecord = record
    },
    setSubjectId(subjectId: string) {
      this.subjectId = subjectId
    },
    setParentMessageId(parentMessageId: string) {
      this.parentMessageId = parentMessageId
    },
    setSubjectList(subjectList: ChatTopic[]) {
      this.subjectList = subjectList
    },
    addSubject(item: ChatTopic) {
      // 判断是否subjectList是否初始化
      if (this.subjectList)
        this.subjectList.unshift(item)
      else
        this.subjectList = [item]
    },
    updateSubjectList(item: any) {
      for (let i = 0; i < this.subjectList.length; i++) {
        if (this.subjectList[i].id === item.id) {
          this.subjectList[i].title = item.title
          break
        }
      }
    },
    setActive(index: number) {
      this.active = index
    },
    setMessageLoading(loading: boolean) {
      this.messagesLoading = loading
    },
    setImageList(imageList: Image[]) {
      this.imageList = imageList
    },
  },
  getters: {
    getChatRecord: state => state.chatRecord,
    getSubjectId: state => state.subjectId,
    getParentMessageId: state => state.parentMessageId,
    getSubjectList: state => state.subjectList,
    getActive: state => state.active,
    getMessageLoading: state => state.messagesLoading,
    getImageList: state => state.imageList,
  },
})
