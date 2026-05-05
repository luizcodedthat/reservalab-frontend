import { sendMessage } from '@/api/chatApi'

export async function chat(message, history) {
  const { data } = await sendMessage(message, history)
  return data.reply
}