"use client"

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { getUsers, createUser, updateUser, deleteUser } from "@/services/userService"
import { getLocations } from "@/services/locationService"

export default function MasterUserPage() {
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // Form states
    const [currentUser, setCurrentUser] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
        location_id: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const loadData = async () => {
        try {
            setLoading(true)
            const [usersRes, locationsRes] = await Promise.all([
                getUsers(),
                getLocations()
            ])
            
            const userData = usersRes.data.data || usersRes.data || []
            setUsers(userData)
            setLocations(locationsRes.data.data || locationsRes.data || [])

            // Ekstrak unique roles dari data users
            const extractedRoles = []
            const roleNames = new Set()
            userData.forEach(u => {
                u.roles?.forEach(r => {
                    if (!roleNames.has(r.name)) {
                        roleNames.add(r.name)
                        extractedRoles.push({ id: r.id, name: r.name })
                    }
                })
            })
            setRoles(extractedRoles)
        } catch (error) {
            toast.error("Gagal mengambil data")
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
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleOpenAdd = () => {
        setFormData({ name: "", email: "", password: "", role: "", location_id: "" })
        setIsAddOpen(true)
    }

    const handleOpenEdit = (user) => {
        setCurrentUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            role: user.roles?.[0]?.name || "",
            location_id: user.location_id || "",
            password: "" // Not used in edit as per controller analysis
        })
        setIsEditOpen(true)
    }

    const handleOpenDelete = (user) => {
        setCurrentUser(user)
        setIsDeleteOpen(true)
    }

    const handleAddSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.location_id) {
            return toast.error("Semua field wajib diisi!")
        }

        setIsSubmitting(true)
        try {
            await createUser(formData)
            toast.success("User berhasil ditambahkan!")
            setIsAddOpen(false)
            loadData()
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menambah user!")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.role || !formData.location_id) {
            return toast.error("Semua field wajib diisi!")
        }

        setIsSubmitting(true)
        try {
            // Controller update method only expects name, email, location_id, role
            const updateData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                location_id: formData.location_id
            }
            await updateUser(currentUser.id, updateData)
            toast.success("User berhasil diperbarui!")
            setIsEditOpen(false)
            loadData()
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal memperbarui user!")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true)
        try {
            await deleteUser(currentUser.id)
            toast.success(`User "${currentUser.name}" berhasil dihapus!`)
            setIsDeleteOpen(false)
            loadData()
        } catch (error) {
            toast.error("Gagal menghapus user!")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredUsers = users.filter(u => {
        const query = debouncedSearch.toLowerCase()
        return u.name.toLowerCase().includes(query) || 
               u.email.toLowerCase().includes(query) ||
               (u.roles?.[0]?.name || "").toLowerCase().includes(query)
    })

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-6 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Cari user..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    />
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-primary/30 flex items-center gap-1.5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Tambah User
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs">
                                <th className="px-5 py-3 font-semibold w-12 text-center">No</th>
                                <th className="px-5 py-3 font-semibold">Nama</th>
                                <th className="px-5 py-3 font-semibold">Email</th>
                                <th className="px-5 py-3 font-semibold text-center">Role</th>
                                <th className="px-5 py-3 font-semibold">Cabang/Lokasi</th>
                                <th className="px-5 py-3 font-semibold text-center w-28">Aksi</th>
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
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Data tidak ditemukan.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, index) => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                                        <td className="px-5 py-3 text-gray-500">{u.email}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                                                {u.roles?.[0]?.name || "-"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">{u.location?.name || "-"}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                                                <button onClick={() => handleOpenDelete(u)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-auto p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>Menampilkan {filteredUsers.length} dari {users.length} data</div>
                    <div className="flex items-center gap-1">
                        <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 opacity-50 cursor-not-allowed">Prev</button>
                        <button className="px-2.5 py-1 rounded bg-primary text-white">1</button>
                        <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 opacity-50 cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>

            {/* MODAL: ADD USER */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Tambah User Baru</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Contoh: John Doe" autoFocus required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="email@example.com" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Password <span className="text-red-500">*</span></label>
                                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Min. 6 karakter" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Role/Akses <span className="text-red-500">*</span></label>
                                        <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Role</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Lokasi Cabang <span className="text-red-500">*</span></label>
                                        <select name="location_id" value={formData.location_id} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Lokasi</option>
                                            {locations.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/30 disabled:opacity-70 flex items-center gap-2">
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT USER */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Edit Akses User</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Contoh: John Doe" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="email@example.com" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Role/Akses <span className="text-red-500">*</span></label>
                                        <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Role</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Lokasi Cabang <span className="text-red-500">*</span></label>
                                        <select name="location_id" value={formData.location_id} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" required>
                                            <option value="">Pilih Lokasi</option>
                                            {locations.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 leading-relaxed">
                                    <span className="font-bold block mb-1">⚠️ Perhatian:</span>
                                    Ganti password hanya dapat dilakukan oleh user yang bersangkutan melalui menu Profile atau oleh Super Admin melalui Database.
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-600/30 disabled:opacity-70 flex items-center gap-2">
                                    {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
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
                        <h3 className="font-bold text-xl text-gray-800 mb-2">Hapus Akses User?</h3>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus user <span className="font-bold text-gray-800">"{currentUser?.name}"</span>? Akun ini tidak akan bisa login kembali.</p>
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
