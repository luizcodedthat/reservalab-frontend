import http from './http'

export function sendMessage(message, history = []) {
  return http.post('/ai/chat', { message, history })
}