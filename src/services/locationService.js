import api, { sendRequest } from "@/lib/api"

export const getLocations = () => {
    return api.get("/locations")
}

export const createLocation = (data) => {
    // Menggunakan sendRequest agar mendukung sistem antrean (offline queue)
    return sendRequest("/locations", data)
}

export const updateLocation = (id, data) => {
    return api.put(`/locations/${id}`, data)
}

export const deleteLocation = (id) => {
    return api.delete(`/locations/${id}`)
}
