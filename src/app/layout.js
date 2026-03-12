import { Poppins } from "next/font/google"
import "./globals.css"
import "./globals.css"
import NetworkStatusListener from "@/components/NetworkStatusListener"
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"]
})

export const metadata = {
  title: "Smart Inventory",
  description: "Inventory Management System"
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <NetworkStatusListener />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
      </body>
    </html>
  )
}