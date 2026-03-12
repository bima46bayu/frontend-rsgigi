import axios from "axios"
import { addToQueue } from "./offlineQueue"

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Global Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401 Unauthorized
    if (error.response && error.response.status === 401) {
      
      // Clean up token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        
        // Only redirect if not already on the login page to prevent infinite loops
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export async function sendRequest(endpoint, payload) {

  if (!navigator.onLine) {

    await addToQueue("POST", endpoint, payload)

    console.log("offline → data queued")

    return {
      queued: true
    }

  }

  return api.post(endpoint, payload)

}

export default api