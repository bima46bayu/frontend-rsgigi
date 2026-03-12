"use client"

import { useEffect } from "react";
import { syncOfflineQueue } from "@/lib/syncQueue";

export default function useNetworkStatus(){

  useEffect(()=>{

    function handleOnline(){

      console.log("internet kembali");

      syncOfflineQueue();

    }

    window.addEventListener("online",handleOnline);

    return ()=>{
      window.removeEventListener("online",handleOnline);
    }

  },[])

}