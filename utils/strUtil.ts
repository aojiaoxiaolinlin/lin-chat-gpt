// 判断的是否是JSON字符串
export function isJsonStr(str: string): boolean {
  try {
    const obj = JSON.parse(str)
    // 等于这个条件说明就是JSON字符串 会返回true
    if (typeof obj == 'object' && obj) {
      return true
    }
    else {
      // 不是就返回false
      return false
    }
  }
  catch (e) {
    return false
  }
}
