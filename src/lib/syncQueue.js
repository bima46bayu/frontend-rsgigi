import { db } from "./offlineDB";
import api from "./api";

export async function syncOfflineQueue(){

  const items = await db.queue.toArray();

  for(const item of items){

    try{

      await api.post(item.endpoint,item.payload);

      await db.queue.delete(item.id);

      console.log("synced item",item.id);

    }catch(err){

      console.log("sync failed",err);

    }

  }

}