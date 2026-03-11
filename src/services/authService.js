import api from "@/lib/api"

export const login = (data) => {
    return api.post("/login", data)
}

export const logout = () => {
    return api.post("/logout")
}

export const getMe = () => {
    return api.get("/me")
}