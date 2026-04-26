"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notificationService"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    })

    // Modal Details state
    const [selectedNotif, setSelectedNotif] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const loadData = async (page = 1) => {
        try {
            setLoading(true)
            const res = await getNotifications({ page })
            const responseData = res.data.data !== undefined ? res.data.data : res.data
            setNotifications(responseData || [])
            
            if (res.data.current_page !== undefined) {
                setPagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total
                })
            }
        } catch (error) {
            toast.error("Gagal mengambil data notifikasi")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData(currentPage)
    }, [currentPage])

    const handleMarkAsRead = async (id, showToast = true) => {
        try {
            await markAsRead(id)
            if (showToast) toast.success("Notifikasi ditandai sudah dibaca")
            setNotifications(prev => prev.map(notif => 
                notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
            ))
        } catch (error) {
            if (error?.response?.status === 405) {
                try {
                    const { default: api } = await import("@/lib/api")
                    await api.put(`/notifications/${id}/read`)
                    if (showToast) toast.success("Notifikasi ditandai sudah dibaca")
                    setNotifications(prev => prev.map(notif => 
                        notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
                    ))
                    return
                } catch (e) {
                    if (showToast) toast.error("Gagal menandai notifikasi")
                }
            } else {
                if (showToast) toast.error("Gagal menandai notifikasi")
            }
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
            toast.success("Semua notifikasi ditandai sudah dibaca")
            loadData(currentPage)
        } catch (error) {
            if (error?.response?.status === 405) {
                try {
                    const { default: api } = await import("@/lib/api")
                    await api.put(`/notifications/read-all`)
                    toast.success("Semua notifikasi ditandai sudah dibaca")
                    loadData(currentPage)
                    return
                } catch (e) {
                    toast.error("Gagal menandai semua notifikasi")
                }
            } else {
                toast.error("Gagal menandai semua notifikasi")
            }
        }
    }

    const handleOpenDetail = (notif) => {
        setSelectedNotif(notif)
        setIsDetailOpen(true)
        if (!notif.read_at) {
            handleMarkAsRead(notif.id, false) // Mark as read without showing individual toast
        }
    }

    // Heuristics to extract content from different notification types
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75C20.25 20.153 16.556 22 12 22s-8.25-1.847-8.25-4.125v-3.75m0 0v3.75" /></svg>
                    </div>
                )
            }
        } else {
            return {
                title: data?.title || "Sistem Notifikasi",
                message: data?.message || "Ada pemberitahuan sistem baru.",
                icon: (
                    <div className="bg-blue-50 text-blue-500 p-2 rounded-xl flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    </div>
                )
            }
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Actions bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-l font-bold text-gray-800">Notifikasi Sistem</h1>
                    <p className="text-xs text-gray-500 mt-1">Daftar pemberitahuan dan log aktivitas sistem terpusat.</p>
                </div>
                <div>
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-primary/10 text-primary font-semibold text-xs rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Tandai Semua Sudah Dibaca
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center py-12 text-gray-400 gap-2">
                            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Memuat notifikasi...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            <span className="text-sm font-medium">Tidak ada notifikasi saat ini.</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notif) => {
                                const isRead = !!notif.read_at;
                                const content = getNotificationContent(notif);
                                return (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => handleOpenDetail(notif)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${isRead ? 'bg-white border-gray-100 hover:shadow-md hover:border-gray-200' : 'bg-primary/5 border-primary/20 shadow-sm hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4 w-full">
                                                {content.icon}
                                                <div className="w-full">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`text-sm ${isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900 flex items-center gap-2'}`}>
                                                            {!isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                                                            {content.title}
                                                        </h3>
                                                        <div className="text-[12px] text-gray-400 font-mono whitespace-nowrap">
                                                            {new Date(notif.created_at).toLocaleString("id-ID", { 
                                                                day: "2-digit", month: "short", year: "numeric", 
                                                                hour: "2-digit", minute: "2-digit"
                                                            })}
                                                        </div>
                                                    </div>
                                                    <p className={`text-xs mt-1.5 leading-relaxed truncate max-w-2xl ${isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                                                        {content.message}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        <span>Klik untuk melihat detail</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {pagination.last_page > 1 && (
                <div className="flex justify-between items-center py-4 px-2">
                    <span className="text-xs text-gray-500">
                        Menampilkan halaman <span className="font-bold">{pagination.current_page}</span> dari <span className="font-bold">{pagination.last_page}</span> ({pagination.total} total data)
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={pagination.current_page <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                            Sebelumnya
                        </button>
                        <button 
                            disabled={pagination.current_page >= pagination.last_page}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.last_page))}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL */}
            {isDetailOpen && selectedNotif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
