"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AuthGuard({ children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        // Cek apakah ada token di localStorage
        const token = localStorage.getItem("token")
        
        if (!token) {
            // Jika tidak ada token dan bukan di halaman login, redirect ke login
            if (!pathname.startsWith("/login")) {
                router.push("/login")
            }
        } else {
            // Jika ada token, izinkan render children
            setIsAuthenticated(true)
        }
    }, [pathname, router])

    // Jangan render apa-apa (atau render loading state) sambil mengecek auth,
    // kecuali kita sudah berada di halaman login (login page menangani dirinya sendiri)
    if (!isAuthenticated && !pathname.startsWith("/login")) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-bgSoft">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return <>{children}</>
}
