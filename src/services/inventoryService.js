import api, { sendRequest, sendPutRequest, sendDeleteRequest } from "@/lib/api"

export const getItems = () => {
    return api.get("/items")
}

export const createItem = (data) => {
    return sendRequest("/items", data)
}

export const updateItem = (id, data) => {
    return sendPutRequest(`/items/${id}`, data)
}

export const deleteItem = (id) => {
    return sendDeleteRequest(`/items/${id}`)
}

export const getItemFlow = (id) => {
    return api.get(`/items/${id}/transactions`)
}

export const getItemBatches = (id) => {
    return api.get(`/items/${id}/stocks`)
}

export const adjustStockIn = (id, data) => {
    return sendRequest(`/items/${id}/stock-in`, data)
}

export const adjustStockOut = (id, data) => {
    return sendRequest(`/items/${id}/stock-out`, data)
}
