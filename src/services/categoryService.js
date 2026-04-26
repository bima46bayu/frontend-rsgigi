import api, { sendRequest } from "@/lib/api"

export const getCategories = () => {
    return api.get("/categories")
}

export const createCategory = (data) => {
    // Gunakan sendRequest untuk mendukung API queueing saat offline (POST)
    return sendRequest("/categories", data)
}

export const updateCategory = (id, data) => {
    return api.put(`/categories/${id}`, data)
}

export const deleteCategory = (id) => {
    return api.delete(`/categories/${id}`)
}
