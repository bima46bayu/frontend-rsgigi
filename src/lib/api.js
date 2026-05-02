import axios from "axios"
import { addToQueue } from "./offlineQueue"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Authorization'] = `Bearer ${token}` // Bypass cPanel header stripping
  }

  return config
})

// Global Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Edge Computing: Simpan data hasil GET ke LocalStorage saat Online
    if (response.config.method === 'get') {
      try {
        localStorage.setItem(`offline_cache_${response.config.url}`, JSON.stringify(response.data))
      } catch (e) { /* Abaikan jika localStorage penuh */ }
    }
    return response;
  },
  (error) => {
    // Jika Offline dan requestnya GET, keluarkan data curian dari LocalStorage
    if (!navigator.onLine && error.config && error.config.method === 'get') {
      const cached = localStorage.getItem(`offline_cache_${error.config.url}`)
      if (cached) {
        console.log(`[Offline Edge] Menggunakan data cache untuk ${error.config.url}`);
        // Memanipulasi Axios agar mengira ini adalah response sukses dari server!
        return Promise.resolve({
          data: JSON.parse(cached),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
        });
      }
    }

    // If the error is 401 Unauthorized
    if (error.response && error.response.status === 401) {

      // Clean up token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")

        // Only redirect if not already on the login page to prevent infinite loops
        if (!window.location.pathname.startsWith("/login")) {
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
    return { queued: true }
  }
  return api.post(endpoint, payload)
}

export async function sendPutRequest(endpoint, payload) {
  if (!navigator.onLine) {
    await addToQueue("PUT", endpoint, payload)
    console.log("offline → data queued (PUT)")
    return { queued: true }
  }
  return api.put(endpoint, payload)
}

export async function sendDeleteRequest(endpoint) {
  if (!navigator.onLine) {
    await addToQueue("DELETE", endpoint, null)
    console.log("offline → data queued (DELETE)")
    return { queued: true }
  }
  return api.delete(endpoint)
}

export default api