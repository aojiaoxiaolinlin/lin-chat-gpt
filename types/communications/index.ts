import type { UsageTokens } from '../tokens'

interface delta {
  role: string
  content: string
}
interface Question {
  content: string
  id: string
  recordTime?: number
}
interface questionAndAnswer {
  delta: delta
  question: Question
  usageTokens: UsageTokens
}

export interface RecordList {
  items: questionAndAnswer[]
}

export interface ChatSubject {
  id: string
  title: string
  list: questionAndAnswer[]
}

export interface Message {
  content: string
  role: 'user' | 'assistant'
}
export interface MessageRecord {
  content: string
  createTime: string
  id: string
  modifyTime: string
  parentMessageId: string
  recordTime: number
  role: 'user' | 'assistant'
  subjectId: string
}

export interface MessageDTO extends Message {
  id: string
  subjectId: string
  parentMessageId: string
  type: number
}

export interface MessagesStore {
  id: string
  messages: Message[]
}

export interface RecordListStore {
  id: string
  recordList: questionAndAnswer[]
}
