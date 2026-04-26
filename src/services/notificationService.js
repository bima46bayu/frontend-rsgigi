import api from "@/lib/api"

export const getNotifications = async (params = {}) => {
    return api.get("/notifications", { params })
}

export const markAsRead = async (id) => {
    return api.post(`/notifications/${id}/read`, {})
}

export const markAllAsRead = async () => {
    return api.post(`/notifications/read-all`, {})
}
