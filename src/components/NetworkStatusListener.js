"use client"

import useNetworkStatus from "@/hooks/useNetworkStatus"

export default function NetworkStatusListener() {
  useNetworkStatus()
  return null
}
