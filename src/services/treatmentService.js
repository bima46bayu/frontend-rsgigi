import api, { sendRequest, sendPutRequest, sendDeleteRequest } from "@/lib/api"

export const getTreatments = () => {
    return api.get("/treatments")
}

export const createTreatment = (data) => {
    return sendRequest("/treatments", data)
}

export const updateTreatment = (id, data) => {
    return sendPutRequest(`/treatments/${id}`, data)
}

export const deleteTreatment = (id) => {
    return sendDeleteRequest(`/treatments/${id}`)
}
