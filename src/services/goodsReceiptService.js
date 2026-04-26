import api, { sendRequest } from "@/lib/api"

export const getGoodsReceipts = (params = {}) => {
    return api.get("/goods-receipts", { params })
}

export const getGoodsReceipt = (id) => {
    return api.get(`/goods-receipts/${id}`)
}

export const createGoodsReceipt = (purchaseId, data) => {
    return sendRequest(`/purchases/${purchaseId}/goods-receipts`, data)
}

export const completeGoodsReceipt = (id) => {
    return api.post(`/goods-receipts/${id}/complete`)
}
