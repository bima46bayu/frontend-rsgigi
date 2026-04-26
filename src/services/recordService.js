import api from "@/lib/api"
import { sendRequest } from "@/lib/api"

export const getRecords = async (params = {}) => {
    return api.get("/records", { params })
}

export const getRecordDetails = async (id) => {
    return api.get(`/records/${id}`)
}

export const createRecordDraft = async (data) => {
    return sendRequest("/records", data)
}

export const updateRecordItems = async (id, items) => {
    return sendRequest(`/records/${id}/items`, { items })
}

export const completeRecord = async (id) => {
    return sendRequest(`/records/${id}/complete`, {})
}

export const rejectRecord = async (id) => {
    return sendRequest(`/records/${id}/reject`, {})
}
