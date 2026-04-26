"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getItems } from "@/services/inventoryService"
import { getNotifications } from "@/services/notificationService"
import { useRealtimeUpdate } from "@/hooks/useRealtime"

export default function Dashboard() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsRes, notifRes] = await Promise.all([
        getItems(),
        getNotifications({ page: 1, limit: 10 })
      ])
      
      setItems(itemsRes.data?.data || itemsRes.data || [])
      setNotifications(notifRes.data?.data || notifRes.data || [])
    } catch (error) {
      console.error("Dashboard data load error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtimeUpdate('inventory', loadData)
  useRealtimeUpdate('notification', loadData)

  const stats = useMemo(() => {
    let total = items.length
    let belowThreshold = 0
    let lowStock = 0
    let critical = 0
    
    items.forEach(item => {
      if (item.alert_status === 'critical') critical++
      else if (item.alert_status === 'warning') lowStock++
      
      if (item.total_stock <= item.min_stock) belowThreshold++
    })
    
    return { total, belowThreshold, lowStock, critical }
  }, [items])

  const criticalAndWarningItems = useMemo(() => {
     return items.filter(i => i.alert_status === 'critical' || i.alert_status === 'warning').sort((a,b) => {
         if (a.alert_status === 'critical' && b.alert_status !== 'critical') return -1;
         if (a.alert_status !== 'critical' && b.alert_status === 'critical') return 1;
         return 0;
     }).slice(0, 5)
  }, [items])
  
  const distribution = useMemo(() => {
      const cats = {};
      items.forEach(item => {
          const catName = item.category?.name || "Tanpa Kategori";
          cats[catName] = (cats[catName] || 0) + 1;
      })
      const total = items.length || 1;
      
      const distArray = Object.entries(cats).map(([name, count]) => ({
          name, 
          count, 
          percentage: Math.round((count / total) * 100)
      })).sort((a,b) => b.count - a.count).slice(0, 4);
      
      const colors = ['bg-blue-500', 'bg-amber-400', 'bg-green-500', 'bg-indigo-500'];
      const borderColors = ['border-b-blue-500', 'border-l-amber-400', 'border-t-green-500', 'border-r-indigo-500'];
      
      return distArray.map((d, i) => ({...d, colorClass: colors[i % colors.length], borderClass: borderColors[i % borderColors.length]}));
  }, [items])

  const recentActivity = notifications.slice(0, 4);

  const getStatusBadge = (status) => {
        switch(status) {
            case 'normal': return <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider">Normal</span>
            case 'warning': return <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider">Warning</span>
            case 'critical': return <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">Critical</span>
            default: return <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-medium">{status}</span>
        }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="bg-white border text-sm text-slate-600 rounded-lg px-4 py-2 flex items-center shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Hari Ini
          </div>
          <button onClick={() => router.push('/inventory')} className="bg-primary text-white font-medium rounded-lg px-5 py-2 hover:bg-primary/90 transition shadow-sm shadow-primary/30 flex items-center">
            Kelola Inventory
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-400 gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold">Memuat Dashboard...</span>
        </div>
      ) : (
        <>
            {/* Top Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm text-slate-500 font-medium">Total Inventory</p>
                    <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.total} <span className="text-lg font-normal text-slate-500">item</span></h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm text-slate-500 font-medium pb-1">Below Threshold</p>
                    <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.belowThreshold} <span className="text-lg font-normal text-slate-500">item</span></h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm text-slate-500 font-medium">Low Stock (Warning)</p>
                    <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.lowStock} <span className="text-lg font-normal text-slate-500">item</span></h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm text-slate-500 font-medium">Reorders Needed (Critical)</p>
                    <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.critical} <span className="text-lg font-normal text-slate-500">item</span></h2>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                </div>
                </div>

            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Inventory Status Overview */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </span>
                    Inventory Status Overview
                    </h3>
                    <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/inventory')} className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 py-2 px-3 rounded-lg transition">Lihat Semua →</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                        <th className="pb-3 pt-2 font-medium">Nama Barang</th>
                        <th className="pb-3 pt-2 font-medium">Kategori</th>
                        <th className="pb-3 pt-2 font-medium">Stok Saat Ini</th>
                        <th className="pb-3 pt-2 font-medium">Min. Stok</th>
                        <th className="pb-3 pt-2 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.slice(0, 5).map(item => (
                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer" onClick={() => router.push(`/inventory`)}>
                                <td className="py-4 font-medium text-slate-700">{item.name}</td>
                                <td className="py-4 text-slate-500 text-xs">{item.category?.name || "Tersedia"}</td>
                                <td className="py-4 text-slate-600 font-semibold">{item.total_stock}</td>
                                <td className="py-4 text-slate-500">{item.min_stock}</td>
                                <td className="py-4 text-center">
                                    {getStatusBadge(item.alert_status)}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-8 text-center text-slate-400">Belum ada barang di inventory.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>

                {/* Inventory Critical/Warning List (User requested section) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </span>
                    Critical & Warnings
                </h3>
                
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    {criticalAndWarningItems.length > 0 ? criticalAndWarningItems.map(item => (
                        <div key={item.id} onClick={() => router.push('/inventory')} className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden group hover:shadow-md transition cursor-pointer ${item.alert_status === 'critical' ? 'border-red-100 bg-red-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${item.alert_status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-bold text-slate-800 line-clamp-1 pr-2">{item.name}</span>
                                <span className={`text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full ${item.alert_status === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}>
                                    {item.alert_status}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Stok: <span className={`font-semibold ${item.alert_status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{item.total_stock}</span></span>
                                <span>Min: {item.min_stock}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-slate-400 text-sm text-center">Tidak ada item yang berstatus critical atau warning saat ini.</p>
                        </div>
                    )}
                </div>

                <button onClick={() => router.push('/inventory')} className="w-full mt-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
                    Lihat Semua Alert
                </button>
                </div>

            </div>

            {/* Bottom Section: Distribution & Notification */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Inventory Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                    </span>
                    Inventory Distribution
                    </h3>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                    {/* Ring Chart CSS with dynamic border classes */}
                    <div className={`w-48 h-48 rounded-full bg-transparent border-[16px] flex items-center justify-center p-2 relative shadow-sm ${distribution[0]?.borderClass || 'border-slate-100'} ${distribution[1]?.borderClass || ''} ${distribution[2]?.borderClass || ''} ${distribution[3]?.borderClass || ''}`}>
                        <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                        <span className="text-slate-400 text-xs font-medium">Kategori</span>
                        <span className="text-2xl font-bold text-slate-800">{distribution.length}</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 w-full space-y-4">
                        {distribution.map((d, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${d.colorClass}`}></div>
                                        <span className="text-sm text-slate-600 font-medium">{d.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{d.percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`${d.colorClass} h-full rounded-full`} style={{ width: `${d.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {distribution.length === 0 && (
                            <div className="text-slate-400 text-sm">Tidak ada data distribusi.</div>
                        )}
                    </div>
                </div>
                </div>

                {/* Small Notifications Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </span>
                    Activity & Notifikasi
                    </h3>
                    {notifications.filter(n => !n.read_at).length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                            {notifications.filter(n => !n.read_at).length} Baru
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    {recentActivity.map((notif) => {
                        const isAlert = notif.data?.type === 'inventory_alert' || notif.type?.includes("Alert");
                        return (
                            <div key={notif.id} className="flex gap-3 items-start">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isAlert ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                {isAlert ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                )}
                                </div>
                                <div>
                                <p className="text-sm font-medium text-slate-800 line-clamp-1"><span className="font-bold">{notif.data?.title || 'Notifikasi'}</span></p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.data?.message || 'Pemberitahuan sistem baru.'}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {new Date(notif.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                                </p>
                                </div>
                            </div>
                        )
                    })}
                    {recentActivity.length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-4">Belum ada aktivitas.</p>
                    )}
                </div>

                <button onClick={() => router.push('/notifications')} className="w-full mt-6 py-2 border border-slate-200 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                    Lihat Semua Notifikasi
                </button>
                </div>

            </div>
        </>
      )}

    </div>
  )
}