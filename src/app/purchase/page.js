"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { 
    getPurchases, 
    getPurchase,
    createPurchase, 
    approvePurchase, 
    cancelPurchase, 
    deletePurchase 
} from "@/services/purchaseService"
import { getSuppliers } from "@/services/supplierService"
import { getItems } from "@/services/inventoryService"
import SearchableSelect from "@/components/SearchableSelect"
import DateRangePicker from "@/components/DateRangePicker"

export default function PurchasePage() {
    const router = useRouter()
    const [purchases, setPurchases] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [allItems, setAllItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Filter states
    const [filterStatus, setFilterStatus] = useState("")
    const [filterSupplier, setFilterSupplier] = useState("")
    const [filterDateRange, setFilterDateRange] = useState({
        start_date: "",
        end_date: ""
    })
    const [showFilters, setShowFilters] = useState(false)
    
    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isApproveOpen, setIsApproveOpen] = useState(false)
    const [isCancelOpen, setIsCancelOpen] = useState(false)
    const [actionPOId, setActionPOId] = useState(null)
    const [selectedPO, setSelectedPO] = useState(null)

    // Form states
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        supplier_id: "",
        notes: "",
        items: [] // { item_id, qty, unit_price }
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
            const [poRes, supRes, itemRes] = await Promise.all([
                getPurchases(),
                getSuppliers(),
                getItems()
            ])
            
            // Perhatikan struktur data dari controller kita
            setPurchases(poRes.data?.data?.data || poRes.data?.data || [])
            setSuppliers(supRes.data?.data || supRes.data || [])
            
            // Filter hanya item yang bertipe stock
            const stockItems = (itemRes.data?.data || itemRes.data || []).filter(i => i.type === 'stock')
            setAllItems(stockItems)
        } catch (error) {
            handleApiError(error, "Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleOpenDetail = async (po) => {
        setIsDetailOpen(true)
        setSelectedPO(po)
        try {
            const res = await getPurchase(po.id)
            setSelectedPO(res.data?.data || res.data)
        } catch (error) {
            handleApiError(error, "Gagal mengambil detail PO")
        }
    }

    const handleOpenAdd = () => {
        setFormData({ supplier_id: "", notes: "", items: [{ item_id: "", qty: 1, unit_price: 0 }] })
        setIsAddOpen(true)
    }

    const addItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item_id: "", qty: 1, unit_price: 0 }]
        }))
    }

    const removeItemRow = (index) => {
        if (formData.items.length === 1) return
        const newItems = [...formData.items]
        newItems.splice(index, 1)
        setFormData(prev => ({ ...prev, items: newItems }))
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items]
        // Pastikan tidak NaN
        const cleanValue = (field === 'qty' || field === 'unit_price') 
            ? (isNaN(value) || value === '' ? 0 : value)
            : value;
            
        newItems[index][field] = cleanValue
        setFormData(prev => ({ ...prev, items: newItems }))
    }

    const handleSubmitAdd = async (e) => {
        e.preventDefault()
        if (!formData.supplier_id || formData.items.some(i => !i.item_id || i.qty < 1)) {
            return toast.error("Harap lengkapi semua data item")
        }
        
        setIsSubmitting(true)
        try {
            await createPurchase(formData)
            toast.success("Purchase Order berhasil dibuat")
            setIsAddOpen(false)
            loadData()
        } catch (error) {
            handleApiError(error, "Gagal membuat PO")
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmApprove = (id) => {
        setActionPOId(id)
        setIsApproveOpen(true)
    }

    const confirmCancel = (id) => {
        setActionPOId(id)
        setIsCancelOpen(true)
    }

    const handleApprove = async () => {
        if (!actionPOId) return
        setIsSubmitting(true)
        try {
            await approvePurchase(actionPOId)
            toast.success("PO disetujui")
            loadData()
            setIsApproveOpen(false)
            if (isDetailOpen) setIsDetailOpen(false)
        } catch (error) {
            handleApiError(error, "Gagal menyetujui PO")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = async () => {
        if (!actionPOId) return
        setIsSubmitting(true)
        try {
            await cancelPurchase(actionPOId)
            toast.success("PO dibatalkan")
            loadData()
            setIsCancelOpen(false)
            if (isDetailOpen) setIsDetailOpen(false)
        } catch (error) {
            handleApiError(error, "Gagal membatalkan PO")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            draft: <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] uppercase">Draft</span>,
            approved: <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase">Approved</span>,
            cancelled: <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[10px] uppercase">Cancelled</span>,
            partially_received: <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] uppercase text-center leading-tight">Sebagian<br/>Diterima</span>,
            received: <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold text-[10px] uppercase">Diterima</span>
        }
        return badges[status] || <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-bold text-[10px] uppercase">{status}</span>
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
    }

    const filteredPurchases = purchases.filter(po => {
        const matchesSearch = po.po_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus ? po.status === filterStatus : true;
        const matchesSupplier = filterSupplier ? String(po.supplier_id) === String(filterSupplier) : true;
        
        let matchesDate = true;
        if (filterDateRange.start_date && filterDateRange.end_date) {
            const poDate = new Date(po.created_at).toISOString().split('T')[0];
            matchesDate = poDate >= filterDateRange.start_date && poDate <= filterDateRange.end_date;
        }

        return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
    })

    return (
        <div className="flex flex-col h-full">
            {/* Header / Actions bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-6 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Cari No PO..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    />
                </div>
                <div className="flex gap-2 relative">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                        Filter
                    </button>
                    <button 
                        onClick={handleOpenAdd}
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-primary/30 flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Buat PO Baru
                    </button>
                    <button 
                        onClick={() => router.push('/purchase/gr')}
                        className="px-3 py-1.5 border border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary/5 transition-colors flex items-center gap-1.5"
                    >
                        Penerimaan Barang (GR)
                    </button>

                    {/* Filter Popover */}
                    {showFilters && (
                        <div className="absolute top-full right-0 mt-2 w-[90vw] max-w-[600px] sm:w-[600px] z-[60] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                                    Filter Data
                                </h4>
                                <button onClick={() => { setFilterStatus(""); setFilterSupplier(""); setFilterDateRange({start_date: "", end_date: ""}); }} className="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded-md font-bold hover:bg-red-100 transition-colors">Reset Filter</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Status PO</label>
                                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 transition-all">
                                        <option value="">Semua Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="approved">Approved</option>
                                        <option value="partially_received">Sebagian Diterima</option>
                                        <option value="received">Diterima</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Supplier</label>
                                    <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 transition-all">
                                        <option value="">Semua Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Rentang Tanggal</label>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                        <DateRangePicker 
                                            value={filterDateRange} 
                                            onChange={(range) => setFilterDateRange(range)} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2 border-t border-gray-50">
                                <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-md">Terapkan Filter</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PO Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-5 py-3 font-semibold w-12 text-center">No</th>
                                <th className="px-5 py-3 font-semibold w-40">Nomor PO</th>
                                <th className="px-5 py-3 font-semibold">Supplier</th>
                                <th className="px-5 py-3 font-semibold text-center w-24">Item</th>
                                <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                                <th className="px-5 py-3 font-semibold text-center w-24">Status</th>
                                <th className="px-5 py-3 font-semibold text-center w-32">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">Belum ada data Purchase Order.</td>
                                </tr>
                            ) : (
                                filteredPurchases.map((po, index) => (
                                    <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-5 py-3 font-black text-gray-900 tracking-wider">
                                            {po.po_number}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-semibold text-gray-800">{po.supplier?.name}</div>
                                            <div className="text-[10px] text-gray-400">Dibuat: {new Date(po.created_at).toLocaleDateString('id-ID')}</div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-bold">
                                                {po.items_count}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-black text-emerald-600">
                                            {formatCurrency(po.total_amount)}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {getStatusBadge(po.status)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button 
                                                    onClick={() => handleOpenDetail(po)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" 
                                                    title="Lihat Detail"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                                </button>
                                                {po.status === 'draft' && (
                                                    <>
                                                        <button 
                                                            onClick={() => confirmApprove(po.id)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Setujui PO"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => confirmCancel(po.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Batalkan PO"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: ADD PO */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Buat Purchase Order Baru</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdd} className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Supplier <span className="text-red-500">*</span></label>
                                    <select 
                                        name="supplier_id" 
                                        value={formData.supplier_id} 
                                        onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} 
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" 
                                        required
                                    >
                                        <option value="">Pilih Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Catatan Tambahan</label>
                                    <input 
                                        type="text" 
                                        name="notes" 
                                        value={formData.notes} 
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                        placeholder="Contoh: Kirim sebelum jam 10" 
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" 
                                    />
                                </div>
                            </div>

                            <div className="mb-4 flex justify-between items-center bg-blue-50/50 p-3 rounded-xl">
                                <h4 className="text-[11px] uppercase font-black text-blue-700 tracking-widest">Daftar Barang (Hanya Stok)</h4>
                                <button 
                                    type="button" 
                                    onClick={addItemRow}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Tambah Baris
                                </button>
                            </div>

                            <div className="space-y-3 mb-6 pb-40">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in slide-in-from-top-1 duration-200">
                                        <div className="flex-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">Barang</label>
                                            <SearchableSelect 
                                                options={allItems}
                                                value={item.item_id}
                                                onChange={(val) => handleItemChange(idx, 'item_id', val)}
                                                placeholder="Cari Barang..."
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">Qty</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.qty} 
                                                onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value))}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-center font-bold"
                                                required
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">Harga Satuan</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                value={item.unit_price} 
                                                onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-right font-medium"
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeItemRow(idx)}
                                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mb-0.5"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center text-sm font-black border-t pt-4">
                                <span className="text-gray-500">ESTIMASI TOTAL:</span>
                                <span className="text-emerald-600 text-lg">
                                    {formatCurrency(formData.items.reduce((sum, i) => sum + (i.qty * i.unit_price || 0), 0))}
                                </span>
                            </div>

                            <div className="mt-8 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Batal</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-all disabled:opacity-70"
                                >
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan & Ajukan PO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DETAIL PO */}
            {isDetailOpen && selectedPO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">Detail Purchase Order</h3>
                                <p className="text-gray-500 text-xs mt-0.5">PO Number: <span className="font-black text-primary uppercase">{selectedPO.po_number}</span></p>
                            </div>
                            <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Supplier</div>
                                        <div className="text-sm font-bold text-gray-800">{selectedPO.supplier?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Tanggal Order</div>
                                        <div className="text-sm font-medium text-gray-800">{new Date(selectedPO.created_at).toLocaleString('id-ID')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Status</div>
                                        <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Catatan</div>
                                        <div className="text-sm italic text-gray-600 bg-gray-100/50 p-2 rounded-lg leading-relaxed">{selectedPO.notes || "-"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Total Pengadaan</div>
                                        <div className="text-lg font-black text-emerald-600">{formatCurrency(selectedPO.total_amount)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-100/50 text-gray-500">
                                        <tr>
                                            <th className="px-4 py-2 font-bold uppercase tracking-widest text-[9px]">Barang Stok</th>
                                            <th className="px-4 py-2 font-bold text-center w-16">Qty</th>
                                            <th className="px-4 py-2 font-bold text-right w-32">Harga Satuan</th>
                                            <th className="px-4 py-2 font-bold text-right w-32">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700">
                                        {selectedPO.items?.map((it, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="px-4 py-3 font-semibold">{it.item?.name}</td>
                                                <td className="px-4 py-3 text-center font-black bg-blue-50/30 text-blue-700">{it.qty_ordered}</td>
                                                <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(it.unit_price)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(it.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
                                {selectedPO.status === 'draft' && (
                                    <>
                                        <button 
                                            onClick={() => confirmCancel(selectedPO.id)}
                                            className="px-6 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                        >
                                            Batalkan & Hapus
                                        </button>
                                        <button 
                                            onClick={() => confirmApprove(selectedPO.id)}
                                            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 transition-all font-black tracking-wide"
                                        >
                                            APPROVE SEKARANG
                                        </button>
                                    </>
                                )}
                                {(selectedPO.status === 'approved' || selectedPO.status === 'partially_received') && (
                                    <button 
                                        onClick={() => router.push(`/purchase/gr`)}
                                        className="px-6 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 transition-all font-black tracking-wide"
                                    >
                                        PROSES PENERIMAAN (GR)
                                    </button>
                                )}
                                <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-all">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL: APPROVE CONFIRMATION */}
            {isApproveOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200 scale-95">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Setujui Purchase Order?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menyetujui PO ini? Status PO akan berubah menjadi Approved dan dapat diproses untuk penerimaan (GR).</p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setIsApproveOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">Batal</button>
                            <button type="button" onClick={handleApprove} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-70 w-full flex justify-center items-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Setujui"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CANCEL CONFIRMATION */}
            {isCancelOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200 scale-95">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Batalkan Purchase Order?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin membatalkan (reject) PO ini? Tindakan ini tidak dapat diubah.</p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setIsCancelOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">Batal</button>
                            <button type="button" onClick={handleCancel} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/30 disabled:opacity-70 w-full flex justify-center items-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Batalkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
