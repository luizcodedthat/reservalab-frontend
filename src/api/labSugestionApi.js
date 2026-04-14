import api from './http'

export const labSuggestionApi = {
  suggest: (payload) =>
    api.post('/ai/labs/suggest', payload)
}