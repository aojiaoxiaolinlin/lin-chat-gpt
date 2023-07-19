import { defineStore } from 'pinia'
import type { ChatImage, ChatMessage, Image, MessageRecord } from '~/types/communications'
import type { ChatTopic } from '~/types/response'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatMessage: [] as ChatMessage[],
    subjectId: '' as string,
    parentMessageId: '-1' as string,
    subjectList: [] as ChatTopic[],
    messagesLoading: false,
    imageList: [] as ChatImage[],
  }),
  actions: {
    setChatRecord(record: any[]) {
      this.chatMessage = record
      // 定位最后一个元素
      this.parentMessageId = this.chatMessage[this.chatMessage.length - 1].answer.id
    },
    reSetChatRecord() {
      this.chatMessage = []
    },
    addChatRecord(question: MessageRecord, answer: MessageRecord) {
      this.chatMessage.push({ question, answer })
    },
    modifyChatRecord(content: string, messageId: string) {
      let index = 0
      for (let i = 0; i < this.getChatMessage.length; i++) {
        if (this.getChatMessage[i].question.id === messageId) {
          index = i
          break
        }
      }
      this.chatMessage[index].question.content = content
      this.chatMessage.splice(index + 1, this.chatMessage.length - index - 1)
    },
    clearLastMessage() {
      this.chatMessage[this.chatMessage.length - 1].answer.content = ''
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
    addImage(question: MessageRecord, answer: Image) {
      this.imageList.push({ question, answer })
    },
    onReceiveMessage(message: any) {
      const last = this.imageList.length - 1
      this.imageList[last].answer.imageUrl = message.imageUrl
      this.imageList[last].answer.imageId = message.imageId
      this.imageList[last].answer.createTime = message.createTime
      this.imageList[last].answer.actions = message.actions
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
    setMessageLoading(loading: boolean) {
      this.messagesLoading = loading
    },
    setImageList(imageList: ChatImage[]) {
      this.imageList = imageList
    },
  },
  getters: {
    getChatMessage: state => state.chatMessage,
    getSubjectId: state => state.subjectId,
    getParentMessageId: state => state.parentMessageId,
    getSubjectList: state => state.subjectList,
    getMessageLoading: state => state.messagesLoading,
    getImageList: state => state.imageList,
  },
})
