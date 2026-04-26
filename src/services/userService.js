import api, { sendRequest } from "@/lib/api"

export const getUsers = () => {
    return api.get("/users")
}

export const createUser = (data) => {
    return sendRequest("/users", data)
}

export const updateUser = (id, data) => {
    return api.put(`/users/${id}`, data)
}

export const deleteUser = (id) => {
    return api.delete(`/users/${id}`)
}
