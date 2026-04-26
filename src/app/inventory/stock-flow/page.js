"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getItemFlow, getItems } from "@/services/inventoryService"
import toast from "react-hot-toast"

function StockFlowContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const id = searchParams.get("id")
    
    const [flowData, setFlowData] = useState([])
    const [loading, setLoading] = useState(true)
    const [itemName, setItemName] = useState("")

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }
        
        const fetchData = async () => {
            setLoading(true)
            try {
                const [flowRes, itemsRes] = await Promise.all([
                    getItemFlow(id),
                    getItems()
                ])
                setFlowData(flowRes.data?.data || flowRes.data || [])
                const items = itemsRes.data?.data || itemsRes.data || []
                const curr = items.find(i => String(i.id) === String(id))
                if (curr) setItemName(curr.name)
            } catch (err) {
                toast.error("Gagal memuat histori stok")
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [id])

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
                <button 
                    onClick={() => router.push("/inventory")}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                </button>
                <div>
                    <h1 className="text-l font-bold text-gray-900 leading-tight">Histori Aliran Stok</h1>
                    <p className="text-xs text-gray-500 mt-1">Melihat riwayat keluar/masuk barang: <span className="font-bold text-primary">{itemName || "Memuat..."}</span></p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden p-6">
                {!id ? (
                    <div className="py-12 text-center text-gray-400">ID Barang tidak ditemukan.</div>
                ) : loading ? (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold text-xs">Memuat histori stok...</span>
                    </div>
                ) : flowData.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic">Belum ada riwayat pergerakan stok untuk barang ini.</div>
                ) : (
                    <div className="space-y-3 max-w-4xl mx-auto max-h-[min(calc(100vh-250px),1000px)] overflow-y-auto pr-2 custom-scrollbar">
                        {flowData.map((f, i) => (
                            <div key={i} className="flex gap-3 items-start relative pb-3 border-l-2 border-gray-100 pl-5 ml-2">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${f.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div className="flex-1 bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${f.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                {f.type === 'in' ? 'TAMBAH (+) ' : 'KURANG (-) '}
                                            </span>
                                            {f.description && <p className="text-sm font-bold text-gray-800 mt-0.5">{f.description}</p>}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(f.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end border-t border-gray-100/50 pt-2">
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            {f.stock?.batch_number && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider w-max">
                                                    Batch: {f.stock.batch_number}
                                                </span>
                                            )}
                                            {(f.reference_type || f.reference_id || f.reference) ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider w-max">
                                                    {f.reference_type === 'record' ? 'Kode Laporan: ' : 
                                                     f.reference_type === 'goods_receipt' ? 'No. PO: ' : 
                                                     (f.reference_type ? f.reference_type.replace('_', ' ') + ' ' : 'Ref: ')}
                                                    {f.reference_code || (f.reference_id || f.reference ? `#${f.reference_id || f.reference}` : '')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-50 text-gray-400 border border-gray-100 uppercase tracking-wider w-max">
                                                    Sistem / Manual
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col justify-end">
                                            <span className={`text-base font-black leading-none ${f.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                {f.type === 'in' ? '+' : '-'}{f.quantity}
                                            </span>
                                            {f.balance_after !== undefined && (
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Balance: {f.balance_after}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function StockFlowPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Memuat...</div>}>
            <StockFlowContent />
        </Suspense>
    )
}
