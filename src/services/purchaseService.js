import api, { sendRequest, sendPutRequest, sendDeleteRequest } from "@/lib/api"

export const getPurchases = (params = {}) => {
    return api.get("/purchases", { params })
}

export const getPurchase = (id) => {
    return api.get(`/purchases/${id}`)
}

export const createPurchase = (data) => {
    return sendRequest("/purchases", data)
}

export const updatePurchase = (id, data) => {
    return sendPutRequest(`/purchases/${id}`, data)
}

export const approvePurchase = (id) => {
    return api.post(`/purchases/${id}/approve`)
}

export const cancelPurchase = (id) => {
    return api.post(`/purchases/${id}/cancel`)
}

export const deletePurchase = (id) => {
    return sendDeleteRequest(`/purchases/${id}`)
}
