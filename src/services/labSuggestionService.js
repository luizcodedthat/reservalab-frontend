import { labSuggestionApi } from '../api/labSuggestionApi'

class LabSuggestionService {

  async suggest({ date, startTime, endTime, userPrompt }) {
    const response = await labSuggestionApi.suggest({ date, startTime, endTime, userPrompt })
    return response.data
  }

}

export default new LabSuggestionService()
