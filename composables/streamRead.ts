import type { ChatMessage } from '~/types/communications'

// Read the stream from the server
export async function read(reader: any,
  target: ChatMessage[]): Promise<any> {
  // TextDecoder is a built-in object that allows you to convert a stream of bytes into a string
  const decoder = new TextDecoder('utf-8')
  // Destructure the value returned by reader.read()
  const { done, value } = await reader.read()
  // If the stream is done reading, release the lock on the reader
  if (done)
    return reader.releaseLock()
  // Convert the stream of bytes into a string
  const chunk = decoder.decode(value, { stream: true })
  target[target.length - 1].answer.content += chunk
  // Repeat the process
  return read(reader, target)
}
