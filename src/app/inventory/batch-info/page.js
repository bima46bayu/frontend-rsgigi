"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getItemBatches, getItems, adjustStockIn, adjustStockOut } from "@/services/inventoryService"
import toast from "react-hot-toast"

function BatchInfoContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const id = searchParams.get("id")
    
    const [batchData, setBatchData] = useState([])
    const [loading, setLoading] = useState(true)
    const [itemName, setItemName] = useState("")

    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [adjustType, setAdjustType] = useState("in") // in or out
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const [formData, setFormData] = useState({
        quantity: "",
        expiry_date: ""
    })

    const loadData = async () => {
        if (!id) return
        setLoading(true)
        try {
            const [batchRes, itemsRes] = await Promise.all([
                getItemBatches(id),
                getItems()
            ])
            setBatchData(batchRes.data?.data || batchRes.data || [])
            const items = itemsRes.data?.data || itemsRes.data || []
            const curr = items.find(i => String(i.id) === String(id))
            if (curr) setItemName(curr.name)
        } catch (err) {
            toast.error("Gagal memuat detail batch")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    const handleOpenAdjust = () => {
        setFormData({ quantity: "", expiry_date: "" })
        setAdjustType("in")
        setIsAdjustOpen(true)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmitAdjust = async (e) => {
        e.preventDefault()
        if (!formData.quantity || formData.quantity <= 0) {
            return toast.error("Kuantitas harus lebih dari 0")
        }
        
        setIsSubmitting(true)
        try {
            if (adjustType === "in") {
                if (!formData.expiry_date) {
                    throw new Error("Expiry Date wajib diisi untuk Stock In")
                }
                await adjustStockIn(id, {
                    quantity: parseInt(formData.quantity),
                    expiry_date: formData.expiry_date
                })
                toast.success("Berhasil menambahkan stok (Stock In)")
            } else {
                await adjustStockOut(id, {
                    quantity: parseInt(formData.quantity)
                })
                toast.success("Berhasil mengurangi stok (Stock Out)")
            }
            setIsAdjustOpen(false)
            loadData() // refresh batches
        } catch (err) {
            toast.error(err.message || "Gagal melakukan penyesuaian stok")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push("/inventory")}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    </button>
                    <div>
                        <h1 className="text-l font-bold text-gray-900 leading-tight">Informasi Batch</h1>
                        <p className="text-xs text-gray-500 mt-1">Stok per batch untuk barang: <span className="font-bold text-secondary">{itemName || "Memuat..."}</span></p>
                    </div>
                </div>
                {id && (
                    <button 
                        onClick={handleOpenAdjust}
                        className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-xl text-xs font-regular transition-colors shadow-lg shadow-secondary/30 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Adjust Stock
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden p-6">
                {!id ? (
                    <div className="py-12 text-center text-gray-400">ID Barang tidak ditemukan.</div>
                ) : loading ? (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                        <span className="font-bold text-xs">Mencari batch barang...</span>
                    </div>
                ) : batchData.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic">Tidak ada informasi batch aktif untuk barang ini.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start max-h-[min(calc(100vh-250px),600px)] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {batchData.map((b, i) => {
                            const isExpired = new Date(b.expiry_date) < new Date()
                            const daysToExpiry = Math.ceil((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                            
                            return (
                                <div key={i} className={`p-4 rounded-xl border transition-all h-fit ${isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Batch Number</div>
                                            <div className="text-[12px] lg:text-[10px] xl:text-[12px] font-black text-gray-900">{b.batch_number}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[13px] font-black ${isExpired ? 'bg-red-500 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                            {b.quantity} <span className="text-[10px] font-medium opacity-80 uppercase">Sisa</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-50 pt-3">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Tanggal Kadaluarsa</div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-bold ${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
                                                {new Date(b.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                            {isExpired ? (
                                                <span className="text-[9px] font-black text-red-600 bg-red-100 px-2.5 py-1 rounded-md">KADALUARSA</span>
                                            ) : daysToExpiry < 90 ? (
                                                <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md">{daysToExpiry} HARI LAGI</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ADUST STOCK MODAL */}
            {isAdjustOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Adjust Stok Barang</h3>
                            <button onClick={() => setIsAdjustOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdjust} className="p-6">
                            <div className="space-y-5">
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button 
                                        type="button" 
                                        onClick={() => setAdjustType("in")} 
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${adjustType === "in" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Stock In (+)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setAdjustType("out")} 
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${adjustType === "out" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Stock Out (-)
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kuantitas <span className="text-red-500">*</span></label>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm" placeholder="Contoh: 10" required />
                                </div>

                                {adjustType === "in" && (
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-8 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAdjustOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Batal</button>
                                <button type="submit" disabled={isSubmitting} className={`px-4 py-2 text-sm font-bold text-white rounded-xl shadow-lg flex items-center gap-2 transition-colors ${adjustType === "in" ? "bg-green-600 hover:bg-green-700 shadow-green-600/30" : "bg-red-600 hover:bg-red-700 shadow-red-600/30"}`}>
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan Adjust
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function BatchInfoPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Memuat...</div>}>
            <BatchInfoContent />
        </Suspense>
    )
}
