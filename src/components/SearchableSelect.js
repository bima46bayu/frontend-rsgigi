"use client"

import { useState, useRef, useEffect } from "react"

export default function SearchableSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "Pilih...", 
    className = "",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const wrapperRef = useRef(null)

    const selectedOption = options.find(opt => opt.id == value)

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const filteredOptions = options.filter(opt => 
        opt.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
            >
                <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <svg className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <input 
                            autoFocus
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id)
                                        setIsOpen(false)
                                        setSearch("")
                                    }}
                                    className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors ${value == opt.id ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700'}`}
                                >
                                    {opt.name}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-[11px] text-gray-400 italic">Tidak ditemukan.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
