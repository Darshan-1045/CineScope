import axios from 'axios'

const apiKey = import.meta.env.VITE_WATCHMODE_API_KEY

export const watchmodeApi = axios.create({
  baseURL: 'https://api.watchmode.com/v1',
  headers: {
    'X-API-Key': apiKey,
  },
  timeout: 15000,
})