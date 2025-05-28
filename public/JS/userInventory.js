import { auth, db } from "./firestore.js"
import { 
    collection, 
    doc, 
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { clearUserInventoryCache } from "./cache.js";

document.addEventListener("DOMContentLoaded", () => {

    // Event listeners for kategoriknapper
    const categoryButtons = document.querySelectorAll(".category-btn");

    // Sett "All Products" som aktiv ved start
    const defaultBtn = document.querySelector('.category-btn[data-category=""]');
    if (defaultBtn) defaultBtn.classList.add("active");

    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Fjern 'active' fra alle knapper
            categoryButtons.forEach(b => b.classList.remove("active"));
            // Legg til 'active' på valgt knapp
            btn.classList.add("active");

            const category = btn.getAttribute("data-category");
            filterInventoryByCategory(category);
        });
    });
});
 
const CACHE_TTL = 24 * 60 * 60 * 1000;

let allInventoryItems = [];
let activeCategoryFilter = null;
let userInventoryRef = null;

//Unngå duplisering av category
const categoryShelfLives = {
    "Cooling Products": 14,
    "Frozen Products": 180,
    "Fruits and Vegetables": 3,
    "Dry Products": 60,
    "Asian": 30
} 


// Vent til brukeren er logget inn og sett opp riktig referanse til inventaret
auth.onAuthStateChanged(async user => {
    if (user) {
        const userId = user.uid;
        userInventoryRef = collection(doc(db, "users", userId), "userInventory");
        fetchUserInventory(userId);

        // Hent brukernavnet fra Firestore og oppdater h2-tittel
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists) {
                const username = userDoc.data().username;
                const inventoryTitle = document.getElementById("inventory-title");
                if (inventoryTitle) {
                    inventoryTitle.textContent = `${username}'s inventory`;
                }
            }
        } catch (error) {
            console.error("Kunne ikke hente brukernavn:", error);
        }

    } else {
        console.error("Ingen bruker er logget inn.");
    }
});
 
async function fetchUserInventory(userId) {
        const userCacheKey = `userInventory_${userId}`;
        const userCacheTimeKey = `userInventory_cache_time_${userId}`;

        const cached = localStorage.getItem(userCacheKey);
        const timestamp = localStorage.getItem(userCacheTimeKey);
        const now = Date.now();

        if(cached && timestamp && now - parseInt(timestamp) < CACHE_TTL){
            console.log("Laster bruker inventar fra cache", userId);
            allInventoryItems = JSON.parse(cached);

            allInventoryItems.forEach(item => {
                item.addedAt = new Date(item.addedAt);

                let shelfLifeDays = 7;

                shelfLifeDays = categoryShelfLives[item.category] ?? 7;

                const expirationDate = new Date(item.addedAt);
                expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

                const today = new Date();
                const timeDiff = expirationDate.getTime() - today.getTime();
                item.daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
            });

            if (activeCategoryFilter) {
                filterInventoryByCategory(activeCategoryFilter);
            }
            else {
                displayUserInventory(allInventoryItems);
            }
            return;
        }
 
        //hent fra firestore om ikke i cache
    try {
        const snapshot = await getDocs(userInventoryRef);
        const inventoryItems = [];
 
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!(data.addedAt && typeof data.addedAt.toDate === "function")) {
                console.warn(`Ugyldig eller manglende 'addedAt' for dokument ${doc.id}, hopper over dette elementet.`);
                return; // Hopp over dette dokumentet i snapshot.forEach
            }

            const addedAt = data.addedAt.toDate();
 
            // Dynamisk holdbarhet basert på kategori
            let shelfLifeDays = 7;

            shelfLifeDays = categoryShelfLives[data.category] ?? 7;
 
            const expirationDate = new Date(addedAt);
            expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);
 
            const today = new Date();
            const timeDiff = expirationDate.getTime() - today.getTime();
            const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
 
            inventoryItems.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                quantity: data.quantity,
                addedAt,
                daysLeft,
            });
        });
 
        // Sorter etter dager igjen, deretter kategori, deretter produktnavn
        inventoryItems.sort((a, b) => {
            if (a.daysLeft !== b.daysLeft) {
                return a.daysLeft - b.daysLeft;
            }
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
 
        allInventoryItems = inventoryItems;
            if (activeCategoryFilter) {
                filterInventoryByCategory(activeCategoryFilter);
            } else {
                displayUserInventory(inventoryItems);
            }

            //for å lagre til cache etter behandling
            localStorage.setItem(userCacheKey, JSON.stringify(inventoryItems));
            localStorage.setItem(userCacheTimeKey, now.toString());
 
    } catch (error) {
        console.error("Feil ved henting av brukerens lager:", error);
    }
}

 
function filterInventoryByCategory(category) {
    activeCategoryFilter = category;
    if (!category) {
        displayUserInventory(allInventoryItems);
    } else {
        const filtered = allInventoryItems.filter(item => item.category === category);
        displayUserInventory(filtered);
    }
}
 
function displayUserInventory(items) {
    const inventoryTable = document.getElementById("inventory-table-body");
    const template = document.getElementById("inventory-row-template");
 
    // Tøm eksisterende rader
    while (inventoryTable.firstChild) {
        inventoryTable.removeChild(inventoryTable.firstChild);
    }
 
    items.forEach(({ id, name, category, quantity, addedAt, daysLeft }) => {
        const row = template.content.cloneNode(true);
       
        const tdName = row.querySelector(".product-name");
        const tdCategory = row.querySelector(".product-category");
        const tdQuantity = row.querySelector(".product-quantity");
        const tdAddedAt = row.querySelector(".product-added-at");
        const tdDaysLeft = row.querySelector(".product-days-left");
        const deleteBtn = row.querySelector(".delete-btn");
        const increaseBtn = row.querySelector(".increase-btn");
        const decreaseBtn = row.querySelector(".decrease-btn");
 
        tdName.textContent = name;
        tdCategory.textContent = category;
        tdQuantity.textContent = quantity;
        tdAddedAt.textContent = addedAt.toLocaleDateString("no-NO");
        tdDaysLeft.textContent = daysLeft === 0 ? "EXPIRED" : `${daysLeft} days`;
 
        // Legg til fargeklasse basert på dager igjen
        if (daysLeft <= 3) {
            tdDaysLeft.classList.add("expiring-red");
        } else if (daysLeft <= 7) {
            tdDaysLeft.classList.add("expiring-orange");
        } else {
            tdDaysLeft.classList.add("expiring-green");
        }
 
        // Øk kvantitet
        increaseBtn.addEventListener("click", async () => {
            const newQuantity = Number(quantity) + 1;
            await updateItemQuantity(id, newQuantity);
            
            const item = allInventoryItems.find(item => item.id === id);
            if (item) item.quantity = newQuantity;

            redisplayFilteredInventory();
        });
 
        // Reduser kvantitet
        decreaseBtn.addEventListener("click", async () => {
            const currentQuantity = Number(quantity);
            if (currentQuantity > 1) {
                await updateItemQuantity(id, currentQuantity - 1);
                
                const item = allInventoryItems.find(item => item.id === id);
                if (item) item.quantity = currentQuantity - 1;

                redisplayFilteredInventory();
            } else {
                const confirmed = window.confirm("Quantity is 1. Remove product completely?");
                if (confirmed) {
                    await deleteInventoryItem(id);
                    
                    allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                    redisplayFilteredInventory();
                }
            }
        });
 
        // Slett produktet
        deleteBtn.setAttribute("data-id", id);
        deleteBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("Are you sure you want to remove this product?");
            if (confirmed) {
                await deleteInventoryItem(id);
                
                allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                redisplayFilteredInventory();
 
                const statusMessage = document.getElementById("status-message");
                statusMessage.textContent = "Product removed.";
                statusMessage.style.display = "block";
                setTimeout(() => {
                    statusMessage.style.display = "none";
                    statusMessage.textContent = "";
                }, 3000);
            }
        });
 
        inventoryTable.appendChild(row);
    });
}
 
 
async function deleteInventoryItem(itemId) {
    try {
        const user = auth.currentUser;
        if(!user){
            console.error("Ingen bruker er logget inn for å slette element");
            return;
        }
        const userId = user.uid;

        await deleteDoc(doc(db, "users", userId, "userInventory", itemId));
        console.log(`Element med ID ${itemId} er slettet.`);
        clearUserInventoryCache(userId);

    } catch (error) {
        console.error("Feil ved sletting av element:", error);
    }
}
 
async function updateItemQuantity(itemId, newQuantity) {
    try {   
        const user = auth.currentUser;
        if(!user){
            console.error("Ingen bruker er logget inn for å oppdatere element");
            return;
        }
        const userId = user.uid;

        await updateDoc(doc(db, "users", userId, "userInventory", itemId), {
            quantity: newQuantity
        });
        console.log(`Oppdatert kvantitet for ${itemId} til ${newQuantity}.`);
        clearUserInventoryCache(userId);

    } catch (error) {
        console.error("Feil ved oppdatering av kvantitet:", error);
    }
}

function redisplayFilteredInventory() {
    if (activeCategoryFilter) {
        const filtered = allInventoryItems.filter(item => item.category === activeCategoryFilter);
        displayUserInventory(filtered);
    } else {
        displayUserInventory(allInventoryItems);
    }
}