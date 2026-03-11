import Sidebar from "@/components/layout/sidebar"
import Navbar from "@/components/layout/navbar"

export default function DashboardLayout({ children }) {

    return (
        <div className="flex min-h-screen bg-bgSoft">

            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                <Navbar />

                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>

            </div>

        </div>
    )

}