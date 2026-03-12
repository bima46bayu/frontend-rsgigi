import Dexie from "dexie";

export const db = new Dexie("inventoryOfflineDB");

db.version(1).stores({
  queue: "++id,type,endpoint,payload,created_at"
});