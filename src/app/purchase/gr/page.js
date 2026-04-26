"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { 
    getGoodsReceipts, 
    createGoodsReceipt, 
    completeGoodsReceipt 
} from "@/services/goodsReceiptService"
import { getPurchases, getPurchase } from "@/services/purchaseService"
import { useRealtimeUpdate } from "@/hooks/useRealtime"

export default function GoodsReceiptPage() {
    const router = useRouter()
    const [activeOrders, setActiveOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modal & Detail states
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedPO, setSelectedPO] = useState(null)
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Form states for new GR
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        items: [] // { purchase_order_item_id, item_id, item_name, qty_ordered, qty_received, qty_rejected, reject_reason, expiry_date }
    })

    const handleApiError = (error, defaultMsg) => {
        const errorData = error.response?.data;
        let message = defaultMsg;
        if (errorData?.errors) {
            const firstErrorKey = Object.keys(errorData.errors)[0];
            message = errorData.errors[firstErrorKey][0];
        } else if (errorData?.message) {
            message = errorData.message;
        }
        toast.error(message);
    }

    const loadData = async () => {
        try {
            setLoading(true)
            // Fetch POs that need arrival (approved or partially_received)
            const poRes = await getPurchases();
            const filtered = (poRes.data?.data?.data || poRes.data?.data || [])
                .filter(po => ['approved', 'partially_received'].includes(po.status));
            
            setActiveOrders(filtered)
        } catch (error) {
            handleApiError(error, "Gagal memuat data pesanan aktif")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useRealtimeUpdate('purchases', loadData)
    useRealtimeUpdate('goods_receipts', loadData)

    const handleOpenDetail = async (po) => {
        setIsDetailOpen(true)
        setSelectedPO(po)
        try {
            // Kita ambil data PO lengkap & data Histori GR secara terpisah agar lebih akurat
            const [poRes, grRes] = await Promise.all([
                getPurchase(po.id),
                getGoodsReceipts({ purchase_order_id: po.id })
            ])

            const fullPO = poRes.data?.data || poRes.data;
            const history = grRes.data?.data?.data || grRes.data?.data || [];
            
            setSelectedPO({
                ...fullPO,
                goods_receipts: history // Kita simpan history ke dalam objek PO
            })
        } catch (error) {
            handleApiError(error, "Gagal memuat histori pesanan")
        }
    }

    const handleOpenAddGR = () => {
        if (!selectedPO) return

        const grItems = (selectedPO.items || []).map(item => {
            const received = parseInt(item.qty_received) || 0;
            const rejected = parseInt(item.qty_rejected) || 0;
            const remaining = item.qty_ordered - received - rejected;
            
            return {
                purchase_order_item_id: item.id,
                item_id: item.item_id,
                item_name: item.item?.name,
                qty_ordered: item.qty_ordered,
                remaining_qty: remaining,
                qty_received: remaining, // default all remaining
                qty_rejected: 0,
                reject_reason: "",
                expiry_date: ""
            }
        })

        setFormData({ items: grItems })
        setIsAddOpen(true)
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items]
        const cleanValue = (field === 'qty_received' || field === 'qty_rejected')
            ? (isNaN(value) || value === '' ? 0 : value)
            : value;
            
        newItems[index][field] = cleanValue
        setFormData(prev => ({ ...prev, items: newItems }))
    }

    const handleSubmitAddItems = async (e) => {
        e.preventDefault()
        
        // Filter out items with 0 total processed
        const itemsToSubmit = formData.items.filter(i => (i.qty_received || 0) + (i.qty_rejected || 0) > 0);
        
        if (itemsToSubmit.length === 0) {
            return toast.error("Minimal 1 item harus diterima/ditolak")
        }

        // Validation
        for (const item of itemsToSubmit) {
            if (item.qty_received > 0 && !item.expiry_date) {
                return toast.error(`Item ${item.item_name} wajib diisi tanggal kadaluarsanya`)
            }
        }

        setIsSubmitting(true)
        try {
            const res = await createGoodsReceipt(selectedPO.id, { items: itemsToSubmit })
            const grMeta = res.data?.data || res.data;
            
            // Auto complete for simplicity as requested?
            // User can complete manually from history, but here we can just complete it 
            // after creation for "Oree simplified flow"
            await completeGoodsReceipt(grMeta.id)
            
            toast.success("Barang berhasil diterima & masuk stok!")
            setIsAddOpen(false)
            setIsDetailOpen(false)
            loadData()
        } catch (error) {
            handleApiError(error, "Gagal memproses penerimaan")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusColor = (status) => {
        if (status === 'partially_received') return 'bg-amber-50 text-amber-600 border-amber-100'
        return 'bg-blue-50 text-blue-600 border-blue-100'
    }

    return (
        <div className="flex flex-col h-full uppercase tracking-tighter">
            {/* Header / Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight">Penerimaan Barang (GR)</h1>
                        <p className="text-gray-400 text-[10px] mt-1 font-bold">Lakukan pengecekan dan terima barang dari pesanan yang sedang berjalan.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black transition-all">Kembali</button>
                    </div>
                </div>
            </div>

            {/* Main Content: Grouped by PO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black tracking-widest uppercase">MENCARI PESANAN AKTIF...</span>
                    </div>
                ) : activeOrders.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Tidak ada pesanan stok yang menunggu kedatangan</span>
                    </div>
                ) : activeOrders.map(po => {
                    // Calculate overall progress
                    const totalOrdered = po.items?.reduce((sum, i) => sum + i.qty_ordered, 0) || 1;
                    const totalReceived = po.items?.reduce((sum, i) => sum + (i.qty_received || 0) + (i.qty_rejected || 0), 0) || 0;
                    const progress = Math.min(Math.round((totalReceived / totalOrdered) * 100), 100);

                    return (
                        <div 
                            key={po.id} 
                            onClick={() => handleOpenDetail(po)}
                            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group animate-in slide-in-from-bottom duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">{po.po_number}</div>
                                    <div className="text-sm font-black text-gray-800 leading-tight group-hover:text-primary transition-colors">{po.supplier?.name}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${getStatusColor(po.status)}`}>
                                    {po.status === 'partially_received' ? 'Sebagian' : 'Approved'}
                                </span>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between text-[9px] font-black mb-2 text-gray-400 uppercase tracking-widest">
                                    <span>Kedatangan Barang</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-50">
                                <div className="text-[9px] font-bold text-gray-400 italic">
                                    {po.items_count} Item Barang
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-black text-primary group-hover:gap-2 transition-all">
                                    PROSES <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL: DETAIL PO & RECEIVE ACTION */}
            {isDetailOpen && selectedPO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="flex h-[75vh]">
                            {/* Left Side: Summary & Action */}
                            <div className="w-1/3 bg-gray-50 p-10 flex flex-col justify-between border-r border-gray-100">
                                <div>
                                    <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-[0.2em]">{selectedPO.po_number}</div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-6">{selectedPO.supplier?.name}</h2>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Internal Notes</label>
                                            <p className="text-xs text-gray-600 bg-white p-4 rounded-2xl border border-gray-200 italic leading-relaxed">
                                                {selectedPO.notes || "Tidak ada catatan internal dari gudang."}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Metadata</label>
                                            <div className="text-[10px] font-bold text-gray-500 space-y-1">
                                                <div>Tgl Order: {new Date(selectedPO.ordered_at).toLocaleDateString('id-ID')}</div>
                                                <div>Admin: {selectedPO.created_by_user?.name || "Gudang RS"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        onClick={handleOpenAddGR}
                                        className="w-full bg-primary text-white py-4 rounded-2xl text-xs font-black shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        TERIMA BARANG BARU
                                    </button>
                                    <button onClick={() => setIsDetailOpen(false)} className="w-full py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">Tutup Detail</button>
                                </div>
                            </div>

                            {/* Right Side: Progress & History */}
                            <div className="flex-1 p-12 flex flex-col h-full overflow-hidden">
                                {/* SECTION 1: ITEM PROGRESS */}
                                <div className="mb-8 shrink-0">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Pantauan Sisa Barang
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedPO.items?.map(it => {
                                            const totalReceived = (it.qty_received || 0) + (it.qty_rejected || 0);
                                            const remaining = it.qty_ordered - totalReceived;
                                            return (
                                                <div key={it.id} className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-sm">{it.item?.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-0.5">Dipesan: {it.qty_ordered}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        {remaining > 0 ? (
                                                            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black">
                                                                SISA: {remaining}
                                                            </div>
                                                        ) : (
                                                            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black">
                                                                LENGKAP
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* SECTION 2: GR HISTORY */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-3 text-primary shrink-0">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Jejak Kedatangan Barang
                                    </h3>
                                    <div className="space-y-4 overflow-y-auto pr-4 custom-scrollbar flex-1 pb-4">
                                        {!selectedPO.goods_receipts || selectedPO.goods_receipts.length === 0 ? (
                                            <div className="text-[10px] font-bold text-gray-300 italic py-10 text-center uppercase tracking-widest border border-dashed rounded-3xl">Belum ada barang yang sampai</div>
                                        ) : (
                                            selectedPO.goods_receipts.map(gr => (
                                                <div key={gr.id} className="relative pl-8 border-l border-gray-100 pb-6 last:pb-0">
                                                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{gr.gr_number}</div>
                                                            <div className="text-[9px] text-gray-400 font-bold">{new Date(gr.received_at).toLocaleString('id-ID')}</div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded uppercase border border-emerald-100">
                                                                DITERIMA: {gr.qty_received || 0}
                                                            </span>
                                                            {(parseInt(gr.qty_rejected) > 0) && (
                                                                <span className="text-[8px] font-black px-2 py-0.5 bg-red-50 text-red-500 rounded uppercase border border-red-100">
                                                                    DITOLAK: {gr.qty_rejected}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ENTRY NEW GR (Simplified) */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in slide-in-from-top duration-500">
                        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">Formulir Penerimaan Barang</h3>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mt-1 tracking-widest">Memproses PO: <span className="text-primary">{selectedPO.po_number}</span></p>
                            </div>
                            <button onClick={() => setIsAddOpen(false)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-gray-100 group">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAddItems} className="p-10 overflow-y-auto max-h-[75vh]">
                            <div className="space-y-4">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className={`p-6 rounded-[30px] border transition-all ${item.remaining_qty === 0 ? 'bg-gray-50 opacity-40 grayscale pointer-events-none' : 'bg-white border-gray-100 shadow-sm hover:shadow-lg'}`}>
                                        <div className="flex flex-col md:flex-row gap-8 items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-gray-400 font-extrabold uppercase mb-1 tracking-widest">Komoditas / Nama Barang</div>
                                                <div className="text-lg font-black text-gray-900 truncate">{item.item_name}</div>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10">SISA: {item.remaining_qty}</span>
                                                    <span className="text-[10px] font-black text-gray-400 px-2 py-0.5 bg-gray-100 rounded">PESANAN: {item.qty_ordered}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4 items-end">
                                                <div className="w-24">
                                                    <label className="text-[10px] uppercase font-black text-emerald-600 mb-2 block text-center tracking-widest">DITERIMA</label>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max={item.remaining_qty}
                                                        value={item.qty_received} 
                                                        onChange={(e) => handleItemChange(idx, 'qty_received', parseInt(e.target.value))}
                                                        className="w-full h-14 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-lg text-center font-black text-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                                        required
                                                    />
                                                </div>

                                                <div className="w-24 text-center">
                                                    <label className="text-[10px] uppercase font-black text-red-500 mb-2 block tracking-widest">DITOLAK</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max={item.remaining_qty - (item.qty_received || 0)}
                                                        value={item.qty_rejected} 
                                                        onChange={(e) => handleItemChange(idx, 'qty_rejected', parseInt(e.target.value))}
                                                        className="w-full h-14 bg-red-50 border-2 border-red-100 rounded-2xl text-lg text-center font-black text-red-600 focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                    />
                                                </div>
                                                
                                                <div className="w-40">
                                                    <label className="text-[10px] uppercase font-black text-amber-600 mb-2 block tracking-widest">TGL KADALUARSA</label>
                                                    <input 
                                                        type="date" 
                                                        value={item.expiry_date} 
                                                        onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                                                        className="w-full h-14 bg-amber-50 border-2 border-amber-100 rounded-2xl text-xs px-4 font-black text-amber-900 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {item.qty_rejected > 0 && (
                                            <div className="mt-4 pt-4 border-t border-red-50 border-dashed animate-in slide-in-from-top-1">
                                                <label className="text-[9px] uppercase font-black text-red-400 mb-2 block tracking-widest">ALASAN PENOLAKAN</label>
                                                <input 
                                                    type="text" 
                                                    value={item.reject_reason} 
                                                    onChange={(e) => handleItemChange(idx, 'reject_reason', e.target.value)}
                                                    placeholder="Contoh: Barcode tidak terdeteksi / Kondisi fisik rusak"
                                                    className="w-full h-12 px-6 bg-red-50/30 border border-red-100 rounded-xl text-xs font-bold text-red-700 italic border-dashed"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 flex justify-end gap-3 pt-8 border-t border-gray-100">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Batalkan Form</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="px-10 py-5 text-sm font-black text-white bg-primary hover:bg-primary/90 rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>KONFIRMASI PENERIMAAN SEKARANG</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
