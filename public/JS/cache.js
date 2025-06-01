/**
 * @author Martin U
 * 
*/

import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db } from "./firestore.js"

const CACHE_KEY = "products";
const CACHE_TIME_KEY = "products_cache_time";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const productsCollectionRef = collection(db, "products")

let products = [];

/**
 * Gets products from Firestore and saves them in `products`.
 * Then shows them on the page using `displayProducts`.
 * Only runs once when the app starts.
 */
 export async function loadProducts() {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) < CACHE_TTL) {
        console.log("Laster produkter fra cache");
        products = JSON.parse(cached);
        return products;
    }

    try {
        console.log("Henter produkter fra Firestore");
        const snapshot = await getDocs(productsCollectionRef);
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        products.sort((a, b) => {
            if (a.category.toLowerCase() < b.category.toLowerCase()) return -1;
            if (a.category.toLowerCase() > b.category.toLowerCase()) return 1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        
        return products;

    } catch (error) {
        console.error("Feil ved henting fra Firestore:", error);
        return [];
    }
}

export function getCachedProducts(){
    return products;
}

export function clearUserInventoryCache(userId){
    if (!userId) return; //For å ikke tømme hvis userId er null
    const userCacheKey = `userInventory_${userId}`;
    const userCacheTimeKey = `userInventory_cache_time_${userId}`;
    localStorage.removeItem(userCacheKey);
    localStorage.removeItem(userCacheTimeKey);
    console.log(`Cache for brukerinventar tømt for bruker ${userId} etter endring.`);    
}