import api from "@/lib/api"

export const getRoles = () => {
    // Hardcoded roles karena endpoint /roles belum tersedia di backend
    return Promise.resolve({
        data: [
            { id: 1, name: "super-admin" },
            { id: 2, name: "admin" },
            { id: 3, name: "user" }
        ]
    })
}
