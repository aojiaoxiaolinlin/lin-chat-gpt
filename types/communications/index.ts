export interface Message {
  content: string
  role: 'user' | 'assistant'
}
export interface MessageRecord {
  content: string
  createTime?: string
  id: string
  modifyTime?: string
  parentMessageId: string
  recordTime?: number
  role: 'user' | 'assistant'
  subjectId: string
}
export interface ChatMessage {
  question: MessageRecord
  answer: MessageRecord
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
  // recordList: ChatRecord[]
}
export interface Image {
  id: string
  imageId: string
  imageUrl: string
  model: number
  prompt: string
  createTime: string
  actions?: string []
}

export interface ChatImage {
  question: MessageRecord
  answer: Image
}
