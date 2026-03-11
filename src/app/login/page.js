"use client"

import { useState } from "react"
import { login } from "@/services/authService"

export default function LoginPage() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e) => {

        e.preventDefault()
        setError("")

        try {

            setLoading(true)

            const res = await login({
                email,
                password
            })

            localStorage.setItem("token", res.data.token)

            window.location.href = "/dashboard"

        } catch (err) {

            setError("Email atau password salah")

        } finally {
            setLoading(false)
        }

    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-bgSoft">

            <div className="grid grid-cols-2 w-[1000px] rounded-[30px] overflow-hidden shadow-xl bg-white">

                {/* LEFT SIDE */}

                <div className="relative bg-gradient-to-br from-primary to-secondary p-12 text-white flex flex-col justify-between">

                    <div>

                        <h1 className="text-3xl font-semibold mb-4">
                            Smart Inventory
                        </h1>

                        <p className="opacity-80 leading-relaxed">
                            Sistem inventory klinik gigi dengan smart predictive
                            alert untuk menghindari kehabisan stok dan
                            memantau masa kadaluarsa.
                        </p>

                    </div>

                    <div className="opacity-70 text-sm">
                        © 2026 Smart Inventory System
                    </div>

                </div>

                {/* RIGHT SIDE */}

                <div className="p-12 flex flex-col justify-center">

                    <h2 className="text-2xl font-semibold mb-6">
                        Welcome Back
                    </h2>

                    <p className="text-gray-500 text-sm mb-8">
                        Login untuk mengakses dashboard inventory
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">

                        <div>

                            <label className="text-sm text-gray-600 mb-1 block">
                                Email
                            </label>

                            <input
                                type="email"
                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primarySoft"
                                placeholder="admin@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                        </div>

                        <div>

                            <label className="text-sm text-gray-600 mb-1 block">
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primarySoft pr-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-3 rounded-xl hover:opacity-90 transition"
                        >

                            {loading ? "Loading..." : "Login"}

                        </button>

                    </form>

                </div>

            </div>

        </div>

    )

}