export function clearUserInventoryCache(userId){
    if (!userId) return; //For å ikke tømme hvis userId er null
    const userCacheKey = `userInventory_${userId}`;
    const userCacheTimeKey = `userInventory_cache_time_${userId}`;
    localStorage.removeItem(userCacheKey);
    localStorage.removeItem(userCacheTimeKey);
    console.log(`Cache for brukerinventar tømt for bruker ${userId} etter endring.`);    
}