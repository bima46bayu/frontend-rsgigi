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

export const deleteRecordDraft = async (id) => {
    return api.delete(`/records/${id}`)
}

export const exportHistory = async (startDate = '', endDate = '') => {
    const response = await api.get("/export/history", {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `history-rekam-medis-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
