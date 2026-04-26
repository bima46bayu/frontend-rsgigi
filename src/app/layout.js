import { Poppins } from "next/font/google"
import "./globals.css"
import NetworkStatusListener from "@/components/NetworkStatusListener"
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper"
import { Toaster } from "react-hot-toast"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"]
})

export const metadata = {
  title: "Smart Inventory",
  description: "Inventory Management System",
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Toaster position="top-right" />
        <NetworkStatusListener />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  )
}