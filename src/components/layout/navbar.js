"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getMe } from "@/services/authService"

export default function Navbar() {

    const [user, setUser] = useState(null)
    const [online, setOnline] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const notifRef = useRef(null)
    const pathname = usePathname()

    // Determine Title from Pathname
    const getPageTitle = () => {
        if (!pathname || pathname === "/dashboard") return "Dashboard"

        // Remove /dashboard prefix and split the rest
        const pathSegments = pathname.replace("/dashboard/", "").split("/")

        // Format words (Capitalize e.g. "master" -> "Master" or "medical-actions" -> "Medical Actions")
        const formatWord = (word) => {
            return word
                .split("-")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
        }

        // e.g. ["master", "category"] -> "Master Category"
        return pathSegments.map(formatWord).join(" ")
    }

    useEffect(() => {
        setMounted(true)
        setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

        const handleOnline = () => setOnline(true)
        const handleOffline = () => setOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

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

        // Handle click outside notification dropdown
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="flex justify-between items-center px-6 py-3 bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)]">

            <div>

                <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary capitalize">
                    {mounted ? getPageTitle() : "Dashboard"}
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

                {/* Network Status */}
                {mounted && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8faff] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-xs font-semibold">
                        {online ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                <span className="text-green-500">Online</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pulse"></span>
                                <span className="text-red-500">Offline</span>
                            </>
                        )}
                    </div>
                )}

                {/* Notification Dropdown Container */}
                <div ref={notifRef} className="relative">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative p-2.5 rounded-[12px] transition-colors shadow-[4px_4px_10px_rgba(0,0,0,0.03),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] ${isNotifOpen ? "bg-[#f4f7fb] text-primary shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]" : "bg-[#f8faff] text-gray-400 hover:text-primary"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#f8faff]"></span>
                    </button>

                    {/* Dropdown Panel */}
                    {isNotifOpen && (
                        <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden z-50">

                            {/* Header */}
                            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-[#f8faff]">
                                <h3 className="text-sm font-bold text-gray-700">Notifications</h3>
                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">2 New</span>
                            </div>

                            {/* List (Dummy Data) */}
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-4 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-500 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700">Stock Menipis: Jarum Suntik</p>
                                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">Stok jarum suntik 5ml tersisa 10 pcs, segera lakukan pembelian (Purchase).</p>
                                        <p className="text-[9px] text-gray-400 mt-1.5 font-medium">Berapa detik yang lalu</p>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"></span>
                                </div>

                                <div className="p-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex-shrink-0 flex items-center justify-center text-green-500 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 opacity-60">Barang Diterima (Good Receipt)</p>
                                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 opacity-60">PO-202305-01 dari Supplier Bintang Medika telah divalidasi dan stok bertambah.</p>
                                        <p className="text-[9px] text-gray-400 mt-1.5 font-medium">2 jam yang lalu</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / See All Button */}
                            <div className="p-2 bg-gray-50 border-t border-gray-100">
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsNotifOpen(false)}
                                    className="block w-full text-center py-2 text-xs font-bold text-primary hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                >
                                    See all notifications &rarr;
                                </Link>
                            </div>

                        </div>
                    )}
                </div>

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