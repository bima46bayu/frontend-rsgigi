"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { getRecords, completeRecord, rejectRecord, getRecordDetails, updateRecordItems } from "@/services/recordService"
import { useRealtimeUpdate } from "@/hooks/useRealtime"

export default function HistoryPage() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    })

    // Modal states
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    
    // Data states
    const [currentRecord, setCurrentRecord] = useState(null)
    const [recordDetails, setRecordDetails] = useState(null)
    const [confirmAction, setConfirmAction] = useState(null) // 'complete' or 'reject'
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    
    // Edit Details State
    const [isEditingItems, setIsEditingItems] = useState(false)
    const [editedItems, setEditedItems] = useState([])
    const [isSavingItems, setIsSavingItems] = useState(false)

    const loadData = async (page = 1) => {
        try {
            setLoading(true)
            const res = await getRecords({ page })
            const responseData = res.data.data !== undefined ? res.data.data : res.data // handle paginated vs unpaginated
            setRecords(responseData || [])
            
            if (res.data.current_page !== undefined) {
                setPagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total
                })
            }
        } catch (error) {
            toast.error("Gagal mengambil data history/rekod medis")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData(currentPage)
    }, [currentPage])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Sinkronisasi data real-time
    useRealtimeUpdate('records', () => loadData(currentPage))

    const handleOpenDetail = async (record) => {
        setCurrentRecord(record)
        setIsDetailOpen(true)
        setIsLoadingDetails(true)
        setIsEditingItems(false)
        
        try {
            const res = await getRecordDetails(record.id)
            setRecordDetails(res.data)
        } catch (error) {
            toast.error("Gagal mengambil detail")
        } finally {
            setIsLoadingDetails(false)
        }
    }

    const startEditingItems = () => {
        const editable = recordDetails.items.map(it => ({
            id: it.item_id, // backend API needs validation id -> maps to item_id
            name: it.item?.name,
            record_treatment_id: it.record_treatment_id,
            quantity: it.quantity
        }))
        setEditedItems(editable)
        setIsEditingItems(true)
    }

    const handleQuantityChange = (index, newQty) => {
        const updated = [...editedItems]
        updated[index].quantity = parseInt(newQty) || 0
        setEditedItems(updated)
    }

    const saveEditedItems = async () => {
        setIsSavingItems(true)
        const toastId = toast.loading("Menyimpan rincian bahan...")
        try {
            const payload = editedItems.filter(i => i.quantity > 0).map(i => ({
                id: i.id,
                record_treatment_id: i.record_treatment_id,
                quantity: i.quantity
            }))
            
            await updateRecordItems(currentRecord.id, payload)
            
            // Refresh details
            const res = await getRecordDetails(currentRecord.id)
            setRecordDetails(res.data)
            
            toast.success("Rincian bahan berhasil diperbarui!", { id: toastId })
            setIsEditingItems(false)
            loadData(currentPage) // refresh table total quantity
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || "Gagal memperbarui rincian bahan", { id: toastId })
        } finally {
            setIsSavingItems(false)
        }
    }

    const handleOpenConfirm = (record, action) => {
        setCurrentRecord(record)
        setConfirmAction(action)
        setIsConfirmOpen(true)
    }

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true)
        try {
            if (confirmAction === 'complete') {
                await completeRecord(currentRecord.id)
                toast.success("Tindakan berhasil diselesaikan")
            } else if (confirmAction === 'reject') {
                await rejectRecord(currentRecord.id)
                toast.success("Tindakan berhasil ditolak")
            }
            setIsConfirmOpen(false)
            if (isDetailOpen) {
                // Refresh details if modal was open
                handleOpenDetail(currentRecord)
            }
            loadData(currentPage) // trigger refresh
        } catch (error) {
            toast.error("Gagal memproses tindakan. Pastikan data valid.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredRecords = records.filter(r => 
        (r.patient_name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (r.code || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        String(r.id).includes(debouncedSearch)
    )

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase rounded-full">Selesai</span>
            case 'cancelled': return <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold text-[10px] uppercase rounded-full">Dibatalkan</span>
            case 'draft': return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 font-bold text-[10px] uppercase rounded-full">Draft</span>
            default: return <span className="px-2.5 py-1 bg-gray-50 text-gray-600 font-bold text-[10px] uppercase rounded-full">{status || "Unknown"}</span>
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
                        placeholder="Cari pasien / ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    />
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-5 py-3 font-semibold w-12 text-center">No</th>
                                <th className="px-5 py-3 font-semibold w-48">Kode Laporan</th>
                                <th className="px-5 py-3 font-semibold w-32">Tanggal</th>
                                <th className="px-5 py-3 font-semibold">Nama Pasien</th>
                                <th className="px-5 py-3 font-semibold w-28 text-center">Tindakan</th>
                                <th className="px-5 py-3 font-semibold w-28 text-center">Jenis Bahan</th>
                                <th className="px-5 py-3 font-semibold w-28 text-center">Qty Bahan</th>
                                <th className="px-5 py-3 font-semibold text-center w-32">Status</th>
                                <th className="px-5 py-3 font-semibold text-center w-40">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex justify-center items-center gap-2 text-xs">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-400 text-sm">Data riwayat tidak ditemukan.</td>
                                </tr>
                            ) : (
                                filteredRecords.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-gray-500 text-center text-xs">{(currentPage - 1) * 10 + index + 1}</td>
                                        <td className="px-5 py-4 font-black text-gray-600 uppercase tracking-wide text-xs">
                                            {item.code || `#${item.id}`}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-xs font-medium text-gray-700">
                                                {new Date(item.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                                {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-900">{item.patient_name || "Tanpa Nama"}</div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-purple-50 text-purple-600 px-3 py-1 rounded-lg font-bold text-xs tracking-wider">
                                                {item.treatments?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold text-xs tracking-wider">
                                                {item.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-orange-50 text-orange-600 px-3 py-1 rounded-lg font-bold text-xs tracking-wider">
                                                {item.items?.reduce((sum, curr) => sum + (Number(curr.quantity) || 0), 0) || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenDetail(item)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="Lihat Detail">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                                </button>
                                                {item.status === 'draft' && (
                                                    <button onClick={() => handleOpenConfirm(item, 'complete')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200" title="Selesaikan">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                                    </button>
                                                )}
                                                {item.status === 'completed' && (
                                                    <button onClick={() => handleOpenConfirm(item, 'reject')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Tolak">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {pagination.last_page > 1 && (
                    <div className="mt-auto p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div>
                            Menampilkan halaman <span className="font-bold">{pagination.current_page}</span> dari <span className="font-bold">{pagination.last_page}</span> ({pagination.total} total data)
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={pagination.current_page <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className={`px-2.5 py-1 rounded border border-gray-200 transition-colors ${pagination.current_page <= 1 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 bg-white'}`}
                            >
                                Prev
                            </button>
                            <button className="px-2.5 py-1 rounded bg-primary text-white font-bold">{pagination.current_page}</button>
                            <button 
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.last_page))}
                                className={`px-2.5 py-1 rounded border border-gray-200 transition-colors ${pagination.current_page >= pagination.last_page ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 bg-white'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: DETAIL */}
            {isDetailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Detail Rekam Medis {currentRecord?.code || `#${currentRecord?.id}`}</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-6 flex-1">
                            {isLoadingDetails ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : recordDetails ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Pasien</p>
                                            <p className="font-semibold text-gray-800 text-sm">{recordDetails.patient_name || "Tanpa Nama"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</p>
                                            <div>{getStatusBadge(recordDetails.status)}</div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Waktu Dibuat</p>
                                            <p className="text-sm text-gray-700">{new Date(recordDetails.created_at).toLocaleString("id-ID")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">ID Transaksi</p>
                                            <p className="text-sm font-mono text-gray-700">{recordDetails.code || `#${recordDetails.id}`}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Tindakan Medis</h4>
                                        {recordDetails.treatments?.length > 0 ? (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr className="text-xs text-gray-500">
                                                            <th className="px-4 py-2 font-semibold">Nama Tindakan</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {recordDetails.treatments.map((tr, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                                                <td className="px-4 py-2 font-medium text-gray-800">
                                                                    {tr.treatment?.name || `Tindakan #${tr.treatment_id}`}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-400 text-sm italic mb-5">
                                                Tidak ada tindakan medis
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center border-b pb-2 mb-3">
                                            <h4 className="text-sm font-bold text-gray-800">Item / Bahan yang Digunakan</h4>
                                            
                                            {recordDetails.status === 'draft' && !isEditingItems && (
                                                <button 
                                                    onClick={startEditingItems} 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    Edit Qty
                                                </button>
                                            )}
                                        </div>
                                        
                                        {isEditingItems ? (
                                            <div className="space-y-3">
                                                {editedItems.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl">
                                                        <span className="text-sm font-medium text-gray-800">{it.name}</span>
                                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-28">
                                                            <button onClick={() => handleQuantityChange(idx, Math.max(0, it.quantity - 1))} className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-r border-gray-200">-</button>
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                value={it.quantity.toString()} 
                                                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                                className="w-full text-center text-sm font-bold text-gray-900 border-none focus:ring-0 p-0"
                                                            />
                                                            <button onClick={() => handleQuantityChange(idx, it.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold border-l border-gray-200">+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button onClick={() => setIsEditingItems(false)} disabled={isSavingItems} className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                                                    <button onClick={saveEditedItems} disabled={isSavingItems} className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md transition-colors flex items-center gap-2">
                                                        {isSavingItems ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Simpan Perubahan'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : recordDetails.items?.length > 0 ? (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr className="text-xs text-gray-500">
                                                            <th className="px-4 py-2 font-semibold">Nama Item</th>
                                                            <th className="px-4 py-2 font-semibold text-center w-24">Jumlah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-sm">
                                                        {recordDetails.items.map((it, idx) => (
                                                            <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                                                <td className="px-4 py-2 font-medium text-gray-800">
                                                                    {it.item?.name || `Item #${it.item_id}`}
                                                                </td>
                                                                <td className="px-4 py-2 text-center text-gray-600 font-bold bg-blue-50/50">{it.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-400 text-sm italic">
                                                Tidak ada item yang tercatat
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons inside details modal */}
                                    {(recordDetails.status === 'draft' || recordDetails.status === 'completed') && !isEditingItems && (
                                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                            {recordDetails.status === 'completed' && (
                                                <button onClick={() => { setIsDetailOpen(false); handleOpenConfirm(recordDetails, 'reject'); }} className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">Batalkan (Reject)</button>
                                            )}
                                            {recordDetails.status === 'draft' && (
                                                <button onClick={() => { setIsDetailOpen(false); handleOpenConfirm(recordDetails, 'complete'); }} className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 transition-colors">Selesaikan Tindakan</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500 text-sm">Gagal memuat detail data.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRM ACTION */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200 scale-95">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction === 'complete' ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
                            {confirmAction === 'complete' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            )}
                        </div>
                        <h3 className="font-bold text-xl text-gray-800 mb-2">
                            {confirmAction === 'complete' ? 'Selesaikan Tindakan?' : 'Tolak Tindakan?'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {confirmAction === 'complete' 
                                ? `Ini akan memotong stok bahan yang digunakan secara permanen untuk pasien "${currentRecord?.patient_name}". Lanjutkan?` 
                                : `Ini akan membatalkan seluruh penggunaan bahan dan record akan ditolak. Lanjutkan?`}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors w-full">Batal</button>
                            <button 
                                type="button" 
                                onClick={handleConfirmSubmit} 
                                disabled={isSubmitting} 
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors w-full flex justify-center items-center gap-2 ${
                                    confirmAction === 'complete' 
                                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30' 
                                        : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                                }`}
                            >
                                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (confirmAction === 'complete' ? "Ya, Selesaikan" : "Ya, Tolak")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
