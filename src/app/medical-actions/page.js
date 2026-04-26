"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from "@/services/treatmentService"
import { getItems } from "@/services/inventoryService"

export default function MedicalActionsPage() {
    const [treatments, setTreatments] = useState([])
    const [inventoryItems, setInventoryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // Data states
    const [currentItem, setCurrentItem] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const initialFormState = {
        code: "",
        name: "",
        description: "",
        is_active: true,
        items: []
    }

    const [formData, setFormData] = useState(initialFormState)

    const loadData = async () => {
        try {
            setLoading(true)
            const [treatmentsRes, itemsRes] = await Promise.all([
                getTreatments(),
                getItems()
            ])
            setTreatments(treatmentsRes.data.data || treatmentsRes.data || [])
            setInventoryItems(itemsRes.data.data || itemsRes.data || [])
        } catch (error) {
            toast.error("Gagal mengambil data tindakan medis")
            console.error(error)
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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value 
        }))
    }

    // Dynamic Items handlers
    const handleAddItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: "", quantity: 1 }]
        }))
    }

    const handleRemoveItemRow = (index) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            newItems.splice(index, 1)
            return { ...prev, items: newItems }
        })
    }

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items]
            newItems[index] = { ...newItems[index], [field]: value }
            return { ...prev, items: newItems }
        })
    }

    const handleOpenAdd = () => {
        setFormData(initialFormState)
        setIsAddOpen(true)
    }

    const handleOpenEdit = (item) => {
        setCurrentItem(item)
        setFormData({
            code: item.code || "",
            name: item.name || "",
            description: item.description || "",
            is_active: item.is_active,
            items: item.items ? item.items.map(i => ({ id: i.id, quantity: i.pivot?.quantity || 1 })) : []
        })
        setIsEditOpen(true)
    }

    const handleOpenDelete = (item) => {
        setCurrentItem(item)
        setIsDeleteOpen(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        if (!formData.code || !formData.name) {
            return toast.error("Kode dan Nama wajib diisi")
        }
        
        // Validation for items
        for (let i = 0; i < formData.items.length; i++) {
            if (!formData.items[i].id) {
                return toast.error("Semua baris barang harus dipilih barangnya")
            }
            if (formData.items[i].quantity <= 0) {
                return toast.error("Jumlah pemakaian harus lebih dari 0")
            }
        }

        setIsSubmitting(true)
        try {
            const payload = { ...formData, is_active: formData.is_active ? 1 : 0 }
            await createTreatment(payload)
            toast.success("Tindakan medis berhasil ditambahkan!")
            setIsAddOpen(false)
            loadData()
        } catch (error) {
            toast.error("Gagal menambahkan tindakan medis")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!formData.code || !formData.name) {
            return toast.error("Kode dan Nama wajib diisi")
        }

        // Validation for items
        for (let i = 0; i < formData.items.length; i++) {
            if (!formData.items[i].id) {
                return toast.error("Semua baris barang harus dipilih barangnya")
            }
            if (formData.items[i].quantity <= 0) {
                return toast.error("Jumlah pemakaian harus lebih dari 0")
            }
        }

        setIsSubmitting(true)
        try {
            const payload = { ...formData, is_active: formData.is_active ? 1 : 0 }
            await updateTreatment(currentItem.id, payload)
            toast.success("Tindakan medis berhasil diperbarui!")
            setIsEditOpen(false)
            loadData()
        } catch (error) {
            toast.error("Gagal memperbarui tindakan medis")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true)
        try {
            await deleteTreatment(currentItem.id)
            toast.success("Tindakan medis berhasil dihapus")
            setIsDeleteOpen(false)
            loadData()
        } catch (error) {
            toast.error("Gagal menghapus tindakan")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredTreatments = treatments.filter(t => 
        t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    )

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
                        placeholder="Cari tindakan (kode/nama)..." 
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
                        Tambah Tindakan
                    </button>
                    <button className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Treatments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-5 py-3 font-semibold w-12 text-center">No</th>
                                <th className="px-5 py-3 font-semibold w-24">Kode</th>
                                <th className="px-5 py-3 font-semibold">Nama Tindakan</th>
                                <th className="px-5 py-3 font-semibold w-48 text-center">Jml Item Terhubung</th>
                                <th className="px-5 py-3 font-semibold text-center w-28">Status</th>
                                <th className="px-5 py-3 font-semibold text-center w-32">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTreatments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Data tindakan tidak ditemukan.</td>
                                </tr>
                            ) : (
                                filteredTreatments.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-5 py-3 font-black text-gray-600 uppercase tracking-wide">{item.code}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{item.description || "-"}</div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wider">
                                                {item.items?.length || 0} ITEM
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {item.is_active ? 
                                                <span className="px-2 py-0.5 bg-green-50 text-green-600 font-bold text-[10px] uppercase rounded-full">Aktif</span> : 
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 font-bold text-[10px] uppercase rounded-full">Nonaktif</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                                                <button onClick={() => handleOpenDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: ADD/EDIT TREATMENT */}
            {(isAddOpen || isEditOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">{isEditOpen ? 'Edit Tindakan Medis' : 'Tambah Tindakan Medis'}</h3>
                            <button onClick={() => isEditOpen ? setIsEditOpen(false) : setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-6 flex-1">
                            <form id="treatment-form" onSubmit={isEditOpen ? handleEditSubmit : handleAddSubmit} className="space-y-6">
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-800 border-b pb-2">Informasi Dasar</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Kode <span className="text-red-500">*</span></label>
                                            <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="EX: TND-001" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm uppercase" required />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Tindakan <span className="text-red-500">*</span></label>
                                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Pembersihan Karang Gigi" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Deskripsi</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Opsional..."></textarea>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2" />
                                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Status Aktif</label>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h4 className="text-xs font-bold text-gray-800">Barang & Obat Digunakan</h4>
                                        <button type="button" onClick={handleAddItemRow} className="text-xs text-primary font-bold hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                            Tambah Item
                                        </button>
                                    </div>
                                    
                                    {formData.items.length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                            <p className="text-xs text-gray-400">Belum ada barang yang ditambahkan untuk tindakan ini.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.items.map((itemRow, index) => (
                                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-100 animate-in slide-in-from-left-2">
                                                    <div className="w-8 text-center text-[10px] font-bold text-gray-400">{index + 1}</div>
                                                    <div className="flex-1">
                                                        <select 
                                                            value={itemRow.id} 
                                                            onChange={(e) => handleItemChange(index, 'id', e.target.value)} 
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                                                            required
                                                        >
                                                            <option value="">-- Pilih Barang --</option>
                                                            {inventoryItems.map(inv => (
                                                                <option key={inv.id} value={inv.id}>{inv.name} {inv.type === 'non-stock' ? '(Non-Stock)' : ''}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-24">
                                                        <input 
                                                            type="number" 
                                                            value={itemRow.quantity} 
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || "")} 
                                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs text-center"
                                                            min="1"
                                                            placeholder="Qty"
                                                            required 
                                                        />
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveItemRow(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2 shrink-0">
                            <button type="button" onClick={() => isEditOpen ? setIsEditOpen(false) : setIsAddOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">Batal</button>
                            <button type="submit" form="treatment-form" disabled={isSubmitting} className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-2 transition-colors">
                                {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Simpan Tindakan
                            </button>
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
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Hapus Tindakan?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus tindakan <span className="font-bold text-gray-800">"{currentItem?.name}"</span>?</p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">Batal</button>
                            <button type="button" onClick={handleDeleteConfirm} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/30 disabled:opacity-70 w-full flex justify-center items-center gap-2">
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
