"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { getItems, createItem, updateItem, deleteItem, adjustStockIn } from "@/services/inventoryService"
import { getCategories } from "@/services/categoryService"
import { useRealtimeUpdate } from "@/hooks/useRealtime"

export default function InventoryPage() {
    const router = useRouter()
    const [items, setItems] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isFlowOpen, setIsFlowOpen] = useState(false)
    const [isBatchOpen, setIsBatchOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Data states
    const [currentItem, setCurrentItem] = useState(null)
    const [flowData, setFlowData] = useState([])
    const [batchData, setBatchData] = useState([])
    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        min_stock: "",
        type: "stock",
        initial_stock: "",
        expiry_date: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDetailLoading, setIsDetailLoading] = useState(false)

    // Helper untuk penanganan error API
    const handleApiError = (error, defaultMsg) => {
        const errorData = error.response?.data;
        
        let message = defaultMsg;

        if (errorData?.errors) {
            // Ambil pesan error pertama dari list validasi
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
            const [itemsRes, catRes] = await Promise.all([
                getItems(),
                getCategories()
            ])
            setItems(itemsRes.data.data || itemsRes.data || [])
            setCategories(catRes.data.data || catRes.data || [])
        } catch (error) {
            handleApiError(error, "Gagal mengambil data inventory")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Sinkronisasi data real-time
    useRealtimeUpdate('inventory', loadData)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleOpenAdd = () => {
        setFormData({ name: "", category_id: "", min_stock: "", type: "stock", initial_stock: "", expiry_date: "" })
        setIsAddOpen(true)
    }

    const handleOpenDetail = (item) => {
        setCurrentItem(item)
        setIsDetailOpen(true)
    }

    const handleOpenEdit = (item) => {
        setCurrentItem(item)
        setFormData({
            name: item.name,
            category_id: item.category_id,
            min_stock: item.min_stock,
            type: item.type || "stock"
        })
        setIsEditOpen(true)
    }

    const handleOpenDelete = (item) => {
        setCurrentItem(item)
        setIsDeleteOpen(true)
    }

    const handleOpenFlow = async (item) => {
        setCurrentItem(item)
        setIsFlowOpen(true)
        setIsDetailLoading(true)
        try {
            const res = await getItemFlow(item.id)
            setFlowData(res.data.data || res.data || [])
        } catch (error) {
            handleApiError(error, "Gagal memuat histori stok")
        } finally {
            setIsDetailLoading(false)
        }
    }

    const handleOpenBatch = async (item) => {
        setCurrentItem(item)
        setIsBatchOpen(true)
        setIsDetailLoading(true)
        try {
            const res = await getItemBatches(item.id)
            setBatchData(res.data.data || res.data || [])
        } catch (error) {
            handleApiError(error, "Gagal memuat detail batch")
        } finally {
            setIsDetailLoading(false)
        }
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.category_id || !formData.min_stock) {
            return toast.error("Harap isi semua field wajib")
        }
        setIsSubmitting(true)
        try {
            const res = await createItem(formData)
            const newItem = res.data?.data || res.data
            
            if (formData.initial_stock && parseInt(formData.initial_stock) > 0 && newItem?.id) {
                if (!formData.expiry_date) {
                    toast.error("Tanggal Kadaluarsa wajib diisi jika Stok Awal > 0")
                    setIsSubmitting(false)
                    return
                }
                await adjustStockIn(newItem.id, {
                    quantity: parseInt(formData.initial_stock),
                    expiry_date: formData.expiry_date
                })
            }
            
            toast.success("Barang berhasil ditambahkan!")
            setIsAddOpen(false)
            loadData()
        } catch (error) {
            handleApiError(error, "Gagal menambahkan barang")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await updateItem(currentItem.id, formData)
            toast.success("Barang berhasil diperbarui!")
            setIsEditOpen(false)
            loadData()
        } catch (error) {
            handleApiError(error, "Gagal memperbarui barang")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true)
        try {
            await deleteItem(currentItem.id)
            toast.success("Barang berhasil dihapus")
            setIsDeleteOpen(false)
            loadData()
        } catch (error) {
            handleApiError(error, "Gagal menghapus barang")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )

    const getStatusBadge = (status) => {
        switch(status) {
            case 'normal': return <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold text-[10px] uppercase">Normal</span>
            case 'warning': return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] uppercase">Warning</span>
            case 'critical': return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[10px] uppercase animate-pulse">Critical</span>
            default: return <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider">{status}</span>
        }
    }

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
                        placeholder="Cari barang atau kategori..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleOpenAdd}
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-primary/30 flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Tambah Barang
                    </button>
                    <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-5 py-3 font-semibold w-12 text-center">No</th>
                                <th className="px-5 py-3 font-semibold">Nama Barang</th>
                                <th className="px-5 py-3 font-semibold">Kategori</th>
                                <th className="px-5 py-3 font-semibold text-center">Stok</th>
                                <th className="px-5 py-3 font-semibold text-center">Min. Stok</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-center w-40">Aksi</th>
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
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">Data tidak ditemukan.</td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-5 py-3 font-medium text-gray-900">
                                            <div>{item.name}</div>
                                            <div className="text-[10px] text-gray-400 font-normal uppercase tracking-tighter mt-0.5">{item.type || 'stock'}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium lowercase">
                                                {item.category?.name || "Tersedia"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`font-bold ${item.total_stock <= item.min_stock ? 'text-red-600' : 'text-primary'}`}>
                                                {item.total_stock}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center text-gray-500 font-medium">
                                            {item.min_stock}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {getStatusBadge(item.alert_status)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => router.push(`/inventory/stock-flow?id=${item.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Aliran Stok"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg></button>
                                                <button onClick={() => router.push(`/inventory/batch-info?id=${item.id}`)} className="p-1.5 text-secondary hover:bg-secondary/5 rounded-lg transition-colors border border-transparent hover:border-secondary/10" title="Informasi Batch"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></button>
                                                <div className="w-px h-4 bg-gray-100 mx-1"></div>
                                                <button onClick={() => handleOpenDetail(item)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Detail Barang"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></button>
                                                <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit Barang"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                                                <button onClick={() => handleOpenDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Barang"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-auto p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>Menampilkan {filteredItems.length} dari {items.length} data</div>
                    <div className="flex items-center gap-1">
                        <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 opacity-50 cursor-not-allowed">Prev</button>
                        <button className="px-2.5 py-1 rounded bg-primary text-white">1</button>
                        <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 opacity-50 cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>

            {/* MODAL: ADD ITEM */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Tambah Barang Baru</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Composite Resin" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kategori <span className="text-red-500">*</span></label>
                                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tipe Barang <span className="text-red-500">*</span></label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="stock">Stock (Dihitung)</option>
                                            <option value="non-stock">Non-Stock (Sekali Pakai)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Minimal Stok <span className="text-red-500">*</span></label>
                                        <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} placeholder="Misal: 10" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium tracking-tight">Sistem akan mengirimkan alert jika stok dibawah angka ini.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Stok Awal</label>
                                        <input type="number" name="initial_stock" value={formData.initial_stock} onChange={handleInputChange} placeholder="Misal: 100" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium tracking-tight">Opsional, tambah stok di awal.</p>
                                    </div>
                                </div>
                                {formData.initial_stock && parseInt(formData.initial_stock) > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tanggal Kadaluarsa <span className="text-red-500">*</span></label>
                                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-medium tracking-tight">Wajib diisi karena stok awal ditambahkan.</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/30 flex items-center gap-2">
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan Barang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT ITEM */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Edit Data Barang</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kategori <span className="text-red-500">*</span></label>
                                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tipe Barang <span className="text-red-500">*</span></label>
                                        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="stock">Stock</option>
                                            <option value="non-stock">Non-Stock</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Minimal Stok <span className="text-red-500">*</span></label>
                                    <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2">
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: FLOW DETAIL */}
            {isFlowOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-blue-50/30">
                            <div>
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">Histori Aliran Stok</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Melihat riwayat keluar/masuk barang: <span className="font-bold text-primary">{currentItem?.name}</span></p>
                            </div>
                            <button onClick={() => setIsFlowOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-8 max-h-[500px] overflow-y-auto">
                            {isDetailLoading ? (
                                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-bold text-xs">Memuat histori stok...</span>
                                </div>
                            ) : flowData.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">Belum ada riwayat pergerakan stok untuk barang ini.</div>
                            ) : (
                                <div className="space-y-4">
                                    {flowData.map((f, i) => (
                                        <div key={i} className="flex gap-4 items-start relative pb-4 border-l-2 border-gray-100 pl-6 ml-3">
                                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${f.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <div className="flex-1 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${f.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {f.type === 'in' ? 'TAMBAH (+) ' : 'KURANG (-) '} - {f.reference || "Sistem"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(f.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <p className="text-sm font-bold text-gray-800">{f.description}</p>
                                                    <div className="text-right">
                                                        <span className={`text-[15px] font-black ${f.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {f.type === 'in' ? '+' : '-'}{f.quantity}
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Balance: {f.balance_after}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: BATCH DETAIL */}
            {isBatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">Detail Batch & Kadaluarsa</h3>
                                <p className="text-gray-500 text-xs mt-0.5">Informasi stok per batch untuk: <span className="font-bold text-secondary">{currentItem?.name}</span></p>
                            </div>
                            <button onClick={() => setIsBatchOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-8">
                            {isDetailLoading ? (
                                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                                    <span className="font-bold text-xs text-secondary/60">Mencari batch barang...</span>
                                </div>
                            ) : batchData.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 italic">Tidak ada informasi batch aktif untuk barang ini.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    {batchData.map((b, i) => {
                                        const isExpired = new Date(b.expiry_date) < new Date()
                                        const daysToExpiry = Math.ceil((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                                        
                                        return (
                                            <div key={i} className={`p-4 rounded-2xl border transition-all ${isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Batch Number</div>
                                                        <div className="text-sm font-black text-gray-900">{b.batch_number}</div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-[13px] font-black ${isExpired ? 'bg-red-500 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                                        {b.quantity} <span className="text-[10px] font-medium opacity-80 uppercase">Sisa</span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-50 pt-3">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Tanggal Kadaluarsa</div>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`font-bold ${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
                                                            {new Date(b.expiry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                        {isExpired ? (
                                                            <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-md">KADALUARSA</span>
                                                        ) : daysToExpiry < 90 ? (
                                                            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">{daysToExpiry} HARI LAGI</span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DELETE CONFIRMATION */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200 scale-95">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Hapus Barang?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus <span className="font-bold text-gray-800">"{currentItem?.name}"</span>? Akun ini tidak akan bisa login kembali.</p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">Batal</button>
                            <button type="button" onClick={handleDeleteConfirm} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/30 disabled:opacity-70 w-full flex justify-center items-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DETAIL ITEM */}
            {isDetailOpen && currentItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Detail Barang</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Barang</h4>
                                <p className="text-sm font-semibold text-gray-900">{currentItem.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kategori</h4>
                                    <p className="text-sm font-medium text-gray-700">{currentItem.category?.name || "-"}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tipe Barang</h4>
                                    <p className="text-sm font-medium text-gray-700 capitalize">{currentItem.type || "stock"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Total Stok</h4>
                                    <p className="text-sm font-bold text-primary">{currentItem.total_stock}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Minimal Stok</h4>
                                    <p className="text-sm font-medium text-gray-700">{currentItem.min_stock}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Status Peringatan</h4>
                                <div className="mt-1 flex">
                                    {getStatusBadge(currentItem.alert_status)}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button type="button" onClick={() => setIsDetailOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
