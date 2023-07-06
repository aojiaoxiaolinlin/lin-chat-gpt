// import GPT3Tokenizer from 'gpt3-tokenizer'
import { encode } from 'gpt-tokenizer'

// const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
// export function computeTokens(str: string): number {
//   const encoded: { bpe: number[]; text: string[] } = tokenizer.encode(str)
//   return encoded.bpe.length
// }

export function computeTokens(str: string): number {
  const encoded = encode(str)
  return encoded.length
}
