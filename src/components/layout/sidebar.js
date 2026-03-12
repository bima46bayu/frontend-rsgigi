"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export default function Sidebar() {

    const pathname = usePathname()
    const router = useRouter()

    const [isMasterOpen, setIsMasterOpen] = useState(pathname.includes("/master"))

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.push("/login")
    }

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
        },
        {
            name: "Pencatatan",
            href: "/records",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
        },
        {
            name: "Master Data",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>,
            subItems: [
                { name: "Category", href: "/master/category" },
                { name: "Lokasi", href: "/master/location" },
                { name: "Supplier", href: "/master/supplier" },
                { name: "User", href: "/master/user" }
            ]
        },
        {
            name: "Inventory",
            href: "/inventory",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
        },
        {
            name: "Tindakan Medis",
            href: "/medical-actions",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Z" /></svg>
        },
        {
            name: "Pembelian & GR",
            href: "/purchase",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
        },
        {
            name: "History",
            href: "/history",
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        }
    ]

    return (
        <div className="w-[240px] h-screen sticky top-0 flex-shrink-0">

            <div className="w-full h-full bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] flex flex-col justify-between py-8 px-5 relative overflow-hidden rounded-[20px] border-r border-[#f4f7fb]">

                {/* TOP DECORATIVE GLOW */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary opacity-5 rounded-full blur-3xl"></div>

                {/* Content Top */}
                <div className="relative z-10">

                    <div className="flex items-center gap-3 mb-12 px-2">
                        <div className="w-10 h-10 bg-white rounded-[14px] flex justify-center items-center font-bold text-xl text-primary shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.8)]">
                            S
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight">
                                Smart Inv
                            </h1>
                            <p className="text-[10px] text-gray-400 font-normal tracking-wide">CLINIC SYSTEM</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {navItems.map((item) => {

                            // Handle items with Sub Menu (like Master Data)
                            if (item.subItems) {
                                const isChildActive = pathname.includes("/master")

                                return (
                                    <div key={item.name} className="flex flex-col">

                                        <button
                                            onClick={() => setIsMasterOpen(!isMasterOpen)}
                                            className={`group relative flex items-center justify-between px-4 py-3 rounded-[10px] transition-all duration-300 overflow-hidden ${isChildActive || isMasterOpen
                                                ? "text-primary shadow-[inset_4px_4px_8px_rgba(0,0,0,0.03),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] bg-[#f8faff]"
                                                : "text-gray-400 hover:text-primary"
                                                }`}
                                        >
                                            {isChildActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-[10px]"></div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <div className={`transition-all duration-300 ${isChildActive ? "scale-110" : "group-hover:scale-110"}`}>
                                                    {item.icon}
                                                </div>
                                                <span className={`text-sm tracking-wide ${isChildActive ? "text-primary font-medium" : "text-gray-500 font-normal group-hover:text-primary rounded-[20px]"}`}>
                                                    {item.name}
                                                </span>
                                            </div>

                                            {/* Chevron Arrow */}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isMasterOpen ? "rotate-180" : ""}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>

                                        {/* Sub Items Dropdown Animation */}
                                        <div className={`flex flex-col ml-9 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${isMasterOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                                            {item.subItems.map((sub) => {
                                                const isActive = pathname === sub.href
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className={`text-xs py-2 px-3 rounded-lg transition-colors ${isActive ? "text-primary font-bold bg-[#f4f7fb]" : "text-gray-400 hover:text-primary hover:bg-gray-50"}`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>

                                    </div>
                                )
                            }

                            // Normal single item logic
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all duration-300 overflow-hidden ${isActive
                                        ? "text-primary shadow-[inset_4px_4px_8px_rgba(0,0,0,0.03),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] bg-[#f8faff]"
                                        : "text-gray-400 hover:text-primary"
                                        }`}
                                >

                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-[10px]"></div>
                                    )}

                                    <div className={`transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`text-sm tracking-wide ${isActive ? "text-primary font-medium" : "text-gray-500 font-normal group-hover:text-primary rounded-[20px]"}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>

                </div>

                {/* Content Bottom / Logout */}
                <div className="relative z-10 mt-auto pt-8 border-t border-gray-100">

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-[10px] text-red-500 hover:text-red-600 transition-all duration-300 hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.03),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] bg-transparent hover:bg-red-50/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        <span className="text-sm font-medium tracking-wide">Logout</span>
                    </button>

                </div>

            </div>

        </div>
    )
}