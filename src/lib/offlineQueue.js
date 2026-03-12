import { db } from "./offlineDB";

export async function addToQueue(type, endpoint, payload){

  await db.queue.add({
    type,
    endpoint,
    payload,
    created_at: new Date()
  });

}