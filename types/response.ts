// 返回数据封装类型
export interface Response<T> {
  code: number
  message: string
  result: T
}

// 列表数据封装
export interface Result<T> {
  list: T[]
}
// 单个数据封装
export interface SingleResult<T> {
  item: T
  uuid: string
}

// 聊天主题数据体
export interface ChatTopic {
  id: string
  userId?: string
  title: string
  createTime?: string
}

export interface Image {
  id: string
  imageId: string
  imageUrl: string
  model: number
  prompt: string
  createTime: string
}
