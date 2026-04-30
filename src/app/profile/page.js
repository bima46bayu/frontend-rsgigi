"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { getMe, updateProfile } from "@/services/authService"

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        receive_alert: false
    })

    // Password Modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [passwordData, setPasswordData] = useState({
        password: "",
        password_confirmation: ""
    })
    const [passwordUpdating, setPasswordUpdating] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            setLoading(true)
            const res = await getMe()
            const userData = res.data
            setUser(userData)
            setFormData({
                name: userData.name || "",
                email: userData.email || "",
                phone_number: userData.phone_number || "",
                receive_alert: userData.receive_alert == 1 || userData.receive_alert === true
            })
        } catch (error) {
            toast.error("Gagal mengambil data profil")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleToggleChange = (e) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target
        setPasswordData(prev => ({ ...prev, [name]: value }))
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        try {
            setUpdating(true)
            const res = await updateProfile(formData)
            setUser(res.data.user)
            toast.success("Profil berhasil diperbarui")
        } catch (error) {
            const message = error.response?.data?.message || "Gagal memperbarui profil"
            toast.error(message)
            if (error.response?.data?.errors) {
                // Handle validation errors if any
                Object.values(error.response.data.errors).flat().forEach(err => toast.error(err))
            }
        } finally {
            setUpdating(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (passwordData.password !== passwordData.password_confirmation) {
            return toast.error("Konfirmasi password tidak cocok")
        }
        if (passwordData.password.length < 6) {
            return toast.error("Password minimal 6 karakter")
        }

        try {
            setPasswordUpdating(true)
            // Combine profile data with password for the update
            const data = {
                ...formData,
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation
            }
            await updateProfile(data)
            toast.success("Password berhasil diperbarui")
            setIsPasswordModalOpen(false)
            setPasswordData({ password: "", password_confirmation: "" })
        } catch (error) {
            const message = error.response?.data?.message || "Gagal memperbarui password"
            toast.error(message)
        } finally {
            setPasswordUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Memuat profil Anda...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl font-black border border-white/30 shadow-2xl">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black tracking-tight">{user?.name}</h1>
                        <p className="text-white/80 font-medium mt-1">{user?.roles?.[0]?.name || "Staff"} • {user?.location?.name}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-bold border border-white/20">
                                ID: {user?.id}
                            </span>
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-bold border border-white/20">
                                Berabung: {new Date(user?.created_at).toLocaleDateString("id-ID", { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Decorative background circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/30 rounded-full blur-3xl -ml-10 -mb-10"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Account Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Informasi Akun</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primarySoft flex items-center justify-center text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Peran / Role</p>
                                    <p className="text-sm font-bold text-gray-700 capitalize">{user?.roles?.[0]?.name || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Lokasi Cabang</p>
                                    <p className="text-sm font-bold text-gray-700">{user?.location?.name || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status Akun</p>
                                    <p className="text-sm font-bold text-green-600">Aktif Terverifikasi</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full bg-white text-gray-700 font-bold py-4 rounded-[2rem] shadow-sm border border-gray-100 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:rotate-12"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        Ubah Password
                    </button>
                    
                    <button 
                        onClick={() => {
                            localStorage.removeItem("token");
                            window.location.href = "/login";
                        }}
                        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-[2rem] hover:bg-red-100 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Keluar dari Sistem
                    </button>
                </div>

                {/* Right Side: Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8">Edit Profil</h3>
                        
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Nama Lengkap</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-bgSoft border-none rounded-2xl py-4 px-5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Masukkan nama lengkap..."
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Alamat Email</label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-bgSoft border-none rounded-2xl py-4 px-5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="email@example.com"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Nomor Telepon / WA</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                            className="w-full bg-bgSoft border-none rounded-2xl py-4 px-5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="628..."
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 bg-primarySoft rounded-2xl border border-primary/10">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Terima Notifikasi Alert</h4>
                                    <p className="text-xs text-gray-500 mt-1">Dapatkan pemberitahuan via Email & WA saat stok kritis/expired</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="receive_alert"
                                        checked={formData.receive_alert}
                                        onChange={handleToggleChange}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="pt-6">
                                <button 
                                    type="submit"
                                    disabled={updating}
                                    className="w-full md:w-auto px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {updating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primarySoft flex items-center justify-center text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818l5.73-5.83a2.25 2.25 0 0 0 .634-1.597V11.37a2.25 2.25 0 0 0-.634-1.596l-5.73-5.83L2.25 1.125h2.818l5.73 5.83c.404.404.945.634 1.503.634h1.087V6.477c0-.56.223-1.096.621-1.492l1.637-1.637a2.25 2.25 0 0 1 1.591-.659h2.152Z" /></svg>
                                </div>
                                Ubah Password
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            name="password"
                                            value={passwordData.password}
                                            onChange={handlePasswordInputChange}
                                            required
                                            className="w-full bg-bgSoft border-none rounded-2xl py-4 px-5 pr-12 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Min. 6 karakter"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswordConfirmation ? "text" : "password"} 
                                            name="password_confirmation"
                                            value={passwordData.password_confirmation}
                                            onChange={handlePasswordInputChange}
                                            required
                                            className="w-full bg-bgSoft border-none rounded-2xl py-4 px-5 pr-12 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Ketik ulang password..."
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                        >
                                            {showPasswordConfirmation ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col gap-3">
                                <button 
                                    type="submit"
                                    disabled={passwordUpdating}
                                    className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {passwordUpdating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Memperbarui...
                                        </>
                                    ) : (
                                        "Simpan Password Baru"
                                    )}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
