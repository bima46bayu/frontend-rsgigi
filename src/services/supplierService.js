import api, { sendRequest } from "@/lib/api"

export const getSuppliers = () => {
    return api.get("/suppliers")
}

export const createSupplier = (data) => {
    return sendRequest("/suppliers", data)
}

export const updateSupplier = (id, data) => {
    return api.put(`/suppliers/${id}`, data)
}

export const deleteSupplier = (id) => {
    return api.delete(`/suppliers/${id}`)
}
