"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getMe } from "@/services/authService"
import { getNotifications, markAsRead } from "@/services/notificationService"
import { useRealtimeNotifications } from "@/hooks/useRealtime"

export default function Navbar() {

    const [user, setUser] = useState(null)
    const [online, setOnline] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [selectedNotif, setSelectedNotif] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const notifRef = useRef(null)
    const pathname = usePathname()

    const unreadCount = notifications.filter(n => !n.read_at).length

    // Listen for real-time notifications
    useRealtimeNotifications(user?.id, (notification) => {
        // Transform incoming notification to match the list format if necessary
        // Typically Laravel sends the notification data object
        setNotifications(prev => [notification, ...prev])
    })

    // Heuristics untuk mengekstrak konten dari berbagai tipe notifikasi (Sinkron dengan page notifikasi)
    const getNotificationContent = (notif) => {
        const data = notif.data || {};
        const isExpiry = data.type === 'stock_expiry' || notif.type?.includes("StockExpiry");
        const isAlert = data.type === 'inventory_alert' || data.type === 'low_stock' || notif.type?.includes("InventoryAlert");
        
        if (isExpiry) {
            return {
                title: `Kedaluwarsa Bahan: ${data.item || "Tidak diketahui"}`,
                message: `Terdapat ${data.quantity || 1} bahan dari batch ${data.batch_number || '-'} yang akan kedaluwarsa dalam ${data.days_remaining || 0} hari.`,
                icon: (
                    <div className="bg-red-50 text-red-500 p-2 rounded-xl flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                )
            }
        } else if (isAlert) {
            const firstItemName = data.items && data.items.length > 0 ? data.items[0].name : (data.item || "Bahan");
            return {
                title: `Peringatan Stok Habis: ${firstItemName}`,
                message: data.message || `Stok persediaan telah mencapai batas minimum. Tolong lakukan pemeriksaan.`,
                icon: (
                    <div className="bg-amber-50 text-amber-500 p-2 rounded-xl flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75C20.25 20.153 16.556 22 12 22s-8.25-1.847-8.25-4.125v-3.75m0 0v3.75" /></svg>
                    </div>
                )
            }
        } else {
            return {
                title: data?.title || "Sistem Notifikasi",
                message: data?.message || "Ada pemberitahuan sistem baru.",
                icon: (
                    <div className="bg-blue-50 text-blue-500 p-2 rounded-xl flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    </div>
                )
            }
        }
    }

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id)
            setNotifications(prev => prev.map(notif => 
                notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
            ))
        } catch (error) {
            console.error("Failed to mark notification as read", error)
        }
    }

    const handleOpenDetail = (notif) => {
        setSelectedNotif(notif)
        setIsDetailOpen(true)
        setIsNotifOpen(false) // Close dropdown
        if (!notif.read_at) {
            handleMarkAsRead(notif.id)
        }
    }

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
        
        const fetchNotifications = async () => {
            try {
                const res = await getNotifications({ page: 1 })
                const responseData = res.data.data !== undefined ? res.data.data : res.data
                setNotifications(responseData || [])
            } catch (err) {
                console.error("Failed to fetch notifications", err)
            }
        }

        fetchUser()
        fetchNotifications()

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
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                        )}
                    </button>

                    {/* Dropdown Panel */}
                    {isNotifOpen && (
                        <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden z-50">

                            {/* Header */}
                            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-[#f8faff]">
                                <h3 className="text-sm font-bold text-gray-700">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
                                )}
                            </div>

                            {/* List (Real Data) */}
                            <div className="max-h-64 overflow-y-auto">
                                {unreadCount === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-400">Belum ada notifikasi baru</div>
                                ) : (
                                    notifications.filter(n => !n.read_at).slice(0, 5).map(notif => {
                                        const isRead = !!notif.read_at;
                                        const content = getNotificationContent(notif);
                                        return (
                                            <div 
                                                key={notif.id}
                                                onClick={() => handleOpenDetail(notif)}
                                                className={`p-4 border-b border-gray-50 flex items-start gap-3 transition-colors cursor-pointer ${isRead ? 'opacity-70 hover:bg-gray-50/50' : 'bg-primary/5 hover:bg-primary/10'}`}
                                            >
                                                {content.icon}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[11px] ${isRead ? 'font-medium text-gray-600' : 'font-bold text-gray-800'} line-clamp-1`}>{content.title}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{content.message}</p>
                                                    <p className="text-[9px] text-gray-400 mt-1.5 font-medium">{new Date(notif.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                {!isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]"></span>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
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
                <Link href="/profile" className="flex items-center gap-2.5 pl-2 border-l border-gray-100 cursor-pointer group">
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
                </Link>

            </div>

            {/* MODAL DETAIL (Sinkron dengan page notifikasi) */}
            {isDetailOpen && selectedNotif && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Detail Notifikasi
                            </h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-6 pb-6 border-b border-gray-100">
                                <h4 className="text-lg font-bold text-gray-900 mb-1">{getNotificationContent(selectedNotif).title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{getNotificationContent(selectedNotif).message}</p>
                            </div>

                            <div className="space-y-4">
                                {(selectedNotif.data?.type === 'stock_expiry' || selectedNotif.type?.includes("StockExpiry")) && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Item</p>
                                                <p className="text-sm font-semibold text-gray-800">{selectedNotif.data?.item || "-"}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</p>
                                                <p className="text-sm font-bold text-red-600 capitalize">{selectedNotif.data?.status || "Peringatan"}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nomor Batch</p>
                                            <p className="text-sm font-mono font-medium text-gray-700">{selectedNotif.data?.batch_number || "-"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tanggal Kedaluwarsa</p>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {selectedNotif.data?.expiry_date ? new Date(selectedNotif.data.expiry_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric'}) : "-"}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                <p className="text-[10px] uppercase font-bold text-amber-600 mb-1">Sisa Waktu</p>
                                                <p className="text-sm font-black text-amber-700">{selectedNotif.data?.days_remaining || 0} Hari</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {(selectedNotif.data?.type === 'inventory_alert' || selectedNotif.data?.type === 'low_stock' || selectedNotif.type?.includes("InventoryAlert")) && (
                                    <div className="space-y-4">
                                        {selectedNotif.data?.location_name && (
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Lokasi</p>
                                                <p className="text-sm font-semibold text-gray-800">{selectedNotif.data.location_name}</p>
                                            </div>
                                        )}
                                        
                                        {selectedNotif.data?.items ? (
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Daftar Item Kritis</p>
                                                <div className="space-y-2">
                                                    {selectedNotif.data.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-800">{item.name}</span>
                                                                <span className="text-[10px] text-gray-400 italic">{item.location_name || selectedNotif.data.location_name}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.status === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600 uppercase'}`}>
                                                                    {item.stock} STOK
                                                                </span>
                                                                <span className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{item.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Item</p>
                                                <p className="text-sm font-semibold text-gray-800">{selectedNotif.data?.item || "-"}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="text-[10px] text-gray-400 font-mono mt-4 text-center">
                                    Diterima pada: {new Date(selectedNotif.created_at).toLocaleString("id-ID")}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-lg shadow-primary/30"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}