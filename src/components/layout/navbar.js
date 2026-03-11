"use client"

import { useState, useEffect } from "react"
import { getMe } from "@/services/authService"

export default function Navbar() {

    const [user, setUser] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getMe()
                setUser(res.data)
            } catch (err) {
                console.error("Failed to fetch user data", err)
            }
        }
        fetchUser()
    }, [])

    return (
        <div className="flex justify-between items-center px-6 py-3 bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] mb-6">

            <div>

                <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Dashboard
                </h2>

                <p className="text-gray-400 text-xs font-medium tracking-wide">
                    Smart predictive inventory monitoring
                </p>

            </div>

            <div className="flex items-center gap-6">

                {/* Search Bar - Optional addition to make navbar look more complete */}
                <div className="hidden md:flex items-center bg-[#f8faff] px-4 py-2.5 rounded-[15px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-xs w-40 text-gray-600 placeholder-gray-400"
                    />
                </div>

                {/* Notification Bell */}
                <button className="relative p-2.5 rounded-[12px] text-gray-400 hover:text-primary transition-colors bg-[#f8faff] shadow-[4px_4px_10px_rgba(0,0,0,0.03),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#f8faff]"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100 cursor-pointer group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                        {user ? user.name?.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-gray-700">{user ? user.name : "Admin"}</p>
                        <p className="text-[10px] text-gray-400">{user ? user.role : "Loading..."}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>

            </div>

        </div>
    )
}