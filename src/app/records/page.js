"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { getTreatments } from "@/services/treatmentService"
import { getItems } from "@/services/inventoryService"
import { createRecordDraft, updateRecordItems, completeRecord } from "@/services/recordService"

export default function RecordsPage() {
    const [treatments, setTreatments] = useState([])
    const [inventoryItems, setInventoryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // POS State
    const [activeTab, setActiveTab] = useState('tindakan')
    const [searchQuery, setSearchQuery] = useState('')
    
    // Draft Sessions State
    const [sessions, setSessions] = useState([
        { id: Date.now(), name: "Pasien 1", patientName: "", cart: [], selectedTreatments: [] }
    ])
    const [activeSessionId, setActiveSessionId] = useState(sessions[0].id)
    const [sessionCounter, setSessionCounter] = useState(1)
    const [isDraftLoaded, setIsDraftLoaded] = useState(false)

    // Helper to get active session
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]

    // Load from localStorage if available (run once on mount)
    useEffect(() => {
        const saved = localStorage.getItem('recordDrafts')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (parsed.sessions && parsed.sessions.length > 0) {
                    setSessions(parsed.sessions)
                    setActiveSessionId(parsed.activeSessionId || parsed.sessions[0].id)
                    setSessionCounter(parsed.sessionCounter || parsed.sessions.length)
                }
            } catch (e) {
                console.error("Gagal memuat draf", e)
            }
        }
        setIsDraftLoaded(true)
    }, [])

    // Save to localStorage whenever sessions change
    useEffect(() => {
        if (isDraftLoaded && sessions.length > 0) {
            localStorage.setItem('recordDrafts', JSON.stringify({
                sessions,
                activeSessionId,
                sessionCounter
            }))
        }
    }, [sessions, activeSessionId, sessionCounter, isDraftLoaded])

    // Session Management Functions
    const createNewSession = () => {
        const newId = Date.now()
        const newCounter = sessionCounter + 1
        setSessions([...sessions, { 
            id: newId, 
            name: `Pasien ${newCounter}`, 
            patientName: "", 
            cart: [], 
            selectedTreatments: [] 
        }])
        setActiveSessionId(newId)
        setSessionCounter(newCounter)
    }

    const removeSession = (id) => {
        if (sessions.length === 1) {
            // If it's the last session, just reset it
            const newId = Date.now()
            setSessions([{ id: newId, name: `Pasien ${sessionCounter + 1}`, patientName: "", cart: [], selectedTreatments: [] }])
            setActiveSessionId(newId)
            setSessionCounter(sessionCounter + 1)
        } else {
            const index = sessions.findIndex(s => s.id === id)
            const newSessions = sessions.filter(s => s.id !== id)
            setSessions(newSessions)
            if (activeSessionId === id) {
                // Switch to previous or next session
                const nextIndex = Math.max(0, index - 1)
                setActiveSessionId(newSessions[nextIndex].id)
            }
        }
    }

    const updateActiveSession = (updater) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return typeof updater === 'function' ? updater(s) : { ...s, ...updater }
            }
            return s
        }))
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const [treatmentsRes, itemsRes] = await Promise.all([
                    getTreatments(),
                    getItems()
                ])
                setTreatments(treatmentsRes.data.data !== undefined ? treatmentsRes.data.data : treatmentsRes.data || [])
                setInventoryItems(itemsRes.data.data !== undefined ? itemsRes.data.data : itemsRes.data || [])
            } catch (error) {
                toast.error("Gagal mengambil data katalog")
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleAddTreatment = (treatment) => {
        updateActiveSession(s => {
            let newSelected = [...s.selectedTreatments]
            if (!newSelected.includes(treatment.id)) {
                newSelected.push(treatment.id)
            }

            let newCart = [...s.cart]
            if (treatment.items && treatment.items.length > 0) {
                treatment.items.forEach(tItem => {
                    const existingIndex = newCart.findIndex(c => c.item.id === tItem.id)
                    const addQty = tItem.pivot ? tItem.pivot.quantity : 1;
                    
                    if (existingIndex >= 0) {
                        newCart[existingIndex] = {
                            ...newCart[existingIndex],
                            quantity: newCart[existingIndex].quantity + addQty
                        }
                    } else {
                        newCart.push({
                            item: tItem,
                            quantity: addQty
                        })
                    }
                })
            }
            
            return { ...s, selectedTreatments: newSelected, cart: newCart }
        })

        if (treatment.items && treatment.items.length > 0) {
            toast.success(`Tindakan ${treatment.name} & item dicatat ke draft`)
        } else {
            toast.success(`Tindakan ${treatment.name} dicatat ke draft`)
        }
    }

    const handleRemoveTreatment = (treatmentId) => {
        const treatment = treatments.find(t => t.id === treatmentId);
        if (!treatment) return;

        updateActiveSession(s => {
            const newSelected = s.selectedTreatments.filter(id => id !== treatmentId);
            let newCart = [...s.cart];

            if (treatment.items && treatment.items.length > 0) {
                treatment.items.forEach(tItem => {
                    const existingIndex = newCart.findIndex(c => c.item.id === tItem.id);
                    if (existingIndex >= 0) {
                        const subQty = tItem.pivot ? tItem.pivot.quantity : 1;
                        newCart[existingIndex] = {
                            ...newCart[existingIndex],
                            quantity: newCart[existingIndex].quantity - subQty
                        }
                    }
                });
                newCart = newCart.filter(c => c.quantity > 0);
            }
            return { ...s, selectedTreatments: newSelected, cart: newCart }
        })
        
        toast.success(`Tindakan ${treatment.name} dibatalkan dari draft`);
    }

    const handleAddExtraItem = (item) => {
        updateActiveSession(s => {
            const newCart = [...s.cart]
            const existingIndex = newCart.findIndex(c => c.item.id === item.id)
            
            if (existingIndex >= 0) {
                newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 }
            } else {
                newCart.push({ item: item, quantity: 1 })
            }
            return { ...s, cart: newCart }
        })
        
        toast.success(`${item.name} ditambahkan ke draft`)
    }

    const updateCartQty = (itemId, delta) => {
        updateActiveSession(s => {
            const newCart = s.cart.map(c => {
                if (c.item.id === itemId) {
                    const newQty = c.quantity + delta
                    return newQty > 0 ? { ...c, quantity: newQty } : null
                }
                return c
            }).filter(Boolean)
            return { ...s, cart: newCart }
        })
    }

    const removeFromCart = (itemId) => {
        updateActiveSession(s => {
            return { ...s, cart: s.cart.filter(c => c.item.id !== itemId) }
        })
    }

    const handleCheckout = async () => {
        if (activeSession.selectedTreatments.length === 0 && activeSession.cart.length === 0) {
            return toast.error("Keranjang kosong. Pilih minimal 1 tindakan atau bahan.")
        }
        
        setIsSubmitting(true)
        const toastId = toast.loading(`Memproses ${activeSession.name}...`)
        
        try {
            // STEP 1: Buat Draft -> Kirim Treatment IDs & Patient Name
            const draftRes = await createRecordDraft({
                patient_name: activeSession.patientName || activeSession.name,
                treatments: activeSession.selectedTreatments
            })
            const record = draftRes.data.data !== undefined ? draftRes.data.data : draftRes.data

            // STEP 2: Sinkronisasi Item di Keranjang (biar sesuai dengan kreasi User)
            if (activeSession.cart.length > 0) {
                const payloadItems = activeSession.cart.map(c => ({
                    id: c.item.id,
                    quantity: c.quantity
                }))
                
                await updateRecordItems(record.id, payloadItems)
            }

            // STEP 3: Complete / Selesaikan dan potong stok
            await completeRecord(record.id)

            toast.success(`Rekam medis ${activeSession.name} berhasil diselesaikan!`, { id: toastId })
            
            // Remove the completed session
            removeSession(activeSessionId)
            
        } catch (error) {
            console.error(error)
            const errorData = error.response?.data
            let message = "Gagal memproses rekam medis"
            
            // Handle validation error specifically for insufficient stock
            if (errorData?.errors?.stock) {
                message = "Stok tidak mencukupi untuk beberapa barang!"
            } else if (errorData?.message) {
                message = errorData.message
            }
            
            toast.error(message, { id: toastId })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveDraft = () => {
        if (activeSession.selectedTreatments.length === 0 && activeSession.cart.length === 0) {
            return toast.error("Keranjang kosong. Pilih minimal 1 tindakan atau bahan.")
        }
        
        // Cukup memberikan notifikasi karena sistem sudah otomatis menyimpan draf ke mode LocalStorage tiap kali ada perubahan.
        // Draf akan tetap ada (tidak direfresh/dihapus) sampai tombol "Selesaikan Rincian" diklik.
        toast.success(`Draft untuk ${activeSession.patientName || activeSession.name} telah disave ke perangkat!`);
    }

    // Filter Logic
    const filteredTreatments = treatments.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) && t.is_active)
    const filteredItems = inventoryItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 p-6">
            
            {/* L E F T : CATALOG (POS Style) */}
            <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                
                {/* Catalog Header & Search */}
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Katalog Medis</h2>
                    
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            className="bg-slate-50 w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                            placeholder="Cari tindakan atau nama bahan..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button 
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'tindakan' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('tindakan')}
                        >
                            Tindakan Medis
                        </button>
                        <button 
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'bahan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab('bahan')}
                        >
                            Bahan Tambahan
                        </button>
                    </div>
                </div>

                {/* Catalog Items Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                             <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                             Memuat katalog...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {activeTab === 'tindakan' ? (
                                filteredTreatments.length > 0 ? filteredTreatments.map(t => (
                                    <div 
                                        key={t.id} 
                                        onClick={() => handleAddTreatment(t)}
                                        className="bg-white border-2 border-transparent hover:border-primary border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm mb-1">{t.name}</h3>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 flex-1">{t.description || "Tidak ada deskripsi"}</p>
                                        <div className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-1 rounded-lg self-start">
                                            {t.items?.length || 0} Bahan Default
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-10 text-center text-slate-400">Tindakan tidak ditemukan.</div>
                                )
                            ) : (
                                filteredItems.length > 0 ? filteredItems.map(item => {
                                    const isNonStock = item.type === 'non-stock';
                                    const isLowStock = !isNonStock && item.total_stock <= item.min_stock;
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleAddExtraItem(item)}
                                            className="bg-white border-2 border-transparent hover:border-amber-500 border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                                        >
                                            {isLowStock && <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">LOW</div>}
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm mb-1 flex-1">{item.name}</h3>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{item.category?.name || "Bahan"}</span>
                                                <span className={`text-xs font-black ${isLowStock ? 'text-red-500' : 'text-slate-700'}`}>
                                                    {isNonStock ? 'Non-Stock' : `Stok: ${item.total_stock}`}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="col-span-full py-10 text-center text-slate-400">Bahan tidak ditemukan.</div>
                                )
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* R I G H T : CART / CHECKOUT */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden max-w-sm z-10">
                
                {/* Draft Tabs Navigation */}
                <div className="bg-slate-100 border-b border-slate-200 flex overflow-x-auto custom-scrollbar">
                    {sessions.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setActiveSessionId(s.id)}
                            className={`px-4 py-3 flex-shrink-0 cursor-pointer flex items-center gap-2 border-b-2 text-sm font-bold transition-all ${activeSessionId === s.id ? 'bg-white border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <span>{s.patientName || s.name}</span>
                            {sessions.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeSession(s.id) }} 
                                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-red-500"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        onClick={createNewSession}
                        className="px-4 py-3 text-slate-500 hover:text-primary hover:bg-slate-200/50 font-bold flex items-center gap-1 transition-colors"
                        title="Tambah Draft Baru"
                    >
                        <svg className="w-4 h-4 text-inherit" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>

                {/* Checkout Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-900 text-white relative">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Rincian Tindakan
                    </h2>
                    <p className="text-xs text-slate-300 font-medium mt-1">Selesaikan rekam bahan untuk <span className="font-bold text-amber-400">{activeSession.name}</span>.</p>
                </div>

                {/* Patient Info */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Pasien</label>
                    <input 
                        type="text" 
                        value={activeSession.patientName}
                        onChange={(e) => updateActiveSession({ patientName: e.target.value })}
                        placeholder="Masukkan nama pasien..." 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold transition-all mb-3"
                    />
                    
                    <div className="flex flex-wrap gap-2">
                        {activeSession.selectedTreatments.map(tid => {
                            const tName = treatments.find(t => t.id === tid)?.name;
                            return tName ? (
                                <span key={tid} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700 group pr-1">
                                    {tName}
                                    <button 
                                        onClick={() => handleRemoveTreatment(tid)} 
                                        className="p-0.5 rounded-md hover:bg-blue-200 text-blue-400 hover:text-blue-800 transition-colors"
                                        title="Batal pilih tindakan"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </span>
                            ) : null
                        })}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">Daftar Bahan Digunakan</h3>
                    
                    {activeSession.cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <span className="text-sm font-bold text-slate-500">Keranjang Masih Kosong</span>
                            <span className="text-xs text-slate-400 mt-1">Pilih tindakan atau bahan dari kiri</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeSession.cart.map((c) => (
                                <div key={c.item.id} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                    <div className="flex-1 pr-3">
                                        <div className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{c.item.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                            {c.item.type === 'non-stock' ? 'Bahan Ekstra' : `Tersedia: ${c.item.total_stock}`}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button onClick={() => removeFromCart(c.item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                                            <button onClick={() => updateCartQty(c.item.id, -1)} className="px-2 py-1 text-slate-600 hover:text-slate-900 transition-colors font-bold">−</button>
                                            <span className="px-2 text-xs font-black text-slate-800 w-8 text-center">{c.quantity}</span>
                                            <button onClick={() => updateCartQty(c.item.id, 1)} className="px-2 py-1 text-primary hover:text-blue-700 transition-colors font-bold">+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Footer Action */}
                <div className="p-5 border-t border-slate-100 bg-white">
                    <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-600">
                        <span>Total Rincian Item:</span>
                        <span className="text-lg text-slate-900">{activeSession.cart.reduce((acc, curr) => acc + curr.quantity, 0)} item</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleCheckout}
                            disabled={isSubmitting || (activeSession.cart.length === 0 && activeSession.selectedTreatments.length === 0)}
                            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
                        >
                            {isSubmitting ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
                            ) : (
                                "Selesaikan Rincian"
                            )}
                        </button>
                        <button 
                            onClick={handleSaveDraft}
                            disabled={isSubmitting || (activeSession.cart.length === 0 && activeSession.selectedTreatments.length === 0)}
                            className="w-full py-3 bg-white border-2 border-primary hover:bg-slate-50 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-primary font-bold rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
                            title="Simpan ke dalam database (Halaman History) sebagai Draft"
                        >
                            Simpan Draft
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
