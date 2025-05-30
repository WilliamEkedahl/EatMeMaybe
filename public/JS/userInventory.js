import { auth, db } from "./firestore.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { clearUserInventoryCache } from "./cache.js"; // Antar denne finnes

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

// Unngå duplisering av category
const categoryShelfLives = {
    "Cooling Products": 7,
    "Frozen Products": 180,
    "Fruits and Vegetables": 5,
    "Dry Products": 240
};

// Vent til brukeren er logget inn og sett opp riktig referanse til inventaret
auth.onAuthStateChanged(async user => {
    if (user) {
        const userId = user.uid;
        // Firebase v9/v11 sintaks for samlingsreferanse
        userInventoryRef = collection(doc(db, "users", userId), "userInventory");
        fetchUserInventory(userId); // Send userId til fetchUserInventory

        // Hent brukernavnet fra Firestore og oppdater h2-tittel
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists) {
                const username = userDoc.data().username;
                const inventoryTitle = document.getElementById("inventory-title");
                if (inventoryTitle) {
                    inventoryTitle.textContent = `Welcome ${username}! Here's your inventory`;
                }
            }
        } catch (error) {
            console.error("Couldn't fetch username.:", error);
        }
    } else {
        console.error("No user is logged in.");
        // <--- NYTT: Legg til logikk her for å tømme tabell / vise "ikke logget inn" melding,
        // hvis dette ikke håndteres av authenticate.js eller HTML.
        // For eksempel, hvis #main-content styres fra authenticate.js.
        // Men vi tømmer i det minste inventaret her:
        displayUserInventory([]); // Tøm tabellen når ingen er logget inn
    }
});

async function fetchUserInventory(userId) { // Mottar userId som argument
    // <--- NYTT: Sjekk om userInventoryRef er null (bruker ikke logget inn) for robusthet
    if (!userInventoryRef) {
        console.error("Cannot fetch inventory: userInventoryRef is not set (no user is logged in?).");
        displayUserInventory([]); // Vis tom tabell
        return; // Avbryt funksjonen
    }

    const userCacheKey = `userInventory_${userId}`;
    const userCacheTimeKey = `userInventory_cache_time_${userId}`;

    const cached = localStorage.getItem(userCacheKey);
    const timestamp = localStorage.getItem(userCacheTimeKey);
    const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) < CACHE_TTL) {
        console.log("Loading user inventory from cache", userId);
        allInventoryItems = JSON.parse(cached);

        allInventoryItems.forEach(item => {
            item.addedAt = new Date(item.addedAt);

            // Bruk categoryShelfLives objektet
            let shelfLifeDays = categoryShelfLives[item.category] ?? 7;

            const expirationDate = new Date(item.addedAt);
            expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expirationDate.setHours(0, 0, 0, 0);
            const timeDiff = expirationDate.getTime() - today.getTime();
            item.daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        });

        // <--- NYTT: Legg til logikk for empty-inventory-message fra gammel fil
        const emptyMessage = document.getElementById("empty-inventory-message");
        if (allInventoryItems.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
        } else {
            if (emptyMessage) emptyMessage.style.display = "none";
        }
        // <--- SLUTT NYTT

        if (activeCategoryFilter) {
            filterInventoryByCategory(activeCategoryFilter);
        } else {
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
                console.warn(`Invalid or missing 'addedAt' for document. ${doc.id}, skips this element.`);
                return; // Hopp over dette dokumentet i snapshot.forEach
            }

            const addedAt = data.addedAt.toDate();

            // Dynamisk holdbarhet basert på kategori ved å bruke categoryShelfLives
            let shelfLifeDays = categoryShelfLives[data.category] ?? 7;

            const expirationDate = new Date(addedAt);
            expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expirationDate.setHours(0, 0, 0, 0);
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

        // <--- NYTT: Legg til logikk for empty-inventory-message fra gammel fil
        const emptyMessage = document.getElementById("empty-inventory-message");
        if (allInventoryItems.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
        } else {
            if (emptyMessage) emptyMessage.style.display = "none";
        }
        // <--- SLUTT NYTT

        if (activeCategoryFilter) {
            filterInventoryByCategory(activeCategoryFilter);
        } else {
            displayUserInventory(inventoryItems);
        }

        // for å lagre til cache etter behandling
        localStorage.setItem(userCacheKey, JSON.stringify(inventoryItems));
        localStorage.setItem(userCacheTimeKey, now.toString());

    } catch (error) {
        console.error("Error occured when fetching user inventory:", error);
    }
}

function filterInventoryByCategory(category) {
    activeCategoryFilter = category;
    // <--- ENDRET FRA GAMMEL: Fikk redisplayFilteredInventory() fra gammel fil
    redisplayFilteredInventory();
}

function redisplayFilteredInventory() { // <--- NYTT: Lagt til denne funksjonen, som eksisterte i gammel fil
    const itemsToDisplay = activeCategoryFilter
        ? allInventoryItems.filter(item => item.category === activeCategoryFilter)
        : allInventoryItems;
    displayUserInventory(itemsToDisplay);
}

function displayUserInventory(items) {
    const inventoryTable = document.getElementById("inventory-table-body");
    const template = document.getElementById("inventory-row-template");
    // <--- NYTT: Hent emptyMessage elementet
    const emptyMessage = document.getElementById("empty-inventory-message");

    // <--- NYTT: Skjul emptyMessage i starten av displayUserInventory fra gammel fil
    if (emptyMessage) emptyMessage.style.display = "none";

    // Tøm eksisterende rader
    while (inventoryTable.firstChild) {
        inventoryTable.removeChild(inventoryTable.firstChild);
    }

    // <--- NYTT: Vis emptyMessage hvis det ikke er noen varer fra gammel fil
    if (items.length === 0) {
        if (emptyMessage) emptyMessage.style.display = "block";
        return; // Avbryt videre visning
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

        // <--- Endret: Knappelyttere er nå direkte her, som i din nye fil.
        // Tidligere i attachInventoryEventListeners i gammel fil

        // Øk kvantitet
        increaseBtn.addEventListener("click", async () => {
            const newQuantity = Number(quantity) + 1;
            await updateItemQuantity(id, newQuantity);

            const item = allInventoryItems.find(item => item.id === id);
            if (item) item.quantity = newQuantity;

            redisplayFilteredInventory(); // <--- Endret: Kaller redisplayFilteredInventory
        });

        // Reduser kvantitet
        decreaseBtn.addEventListener("click", async () => {
            const currentQuantity = Number(quantity);
            if (currentQuantity > 1) {
                await updateItemQuantity(id, currentQuantity - 1);

                const item = allInventoryItems.find(item => item.id === id);
                if (item) item.quantity = currentQuantity - 1;

                redisplayFilteredInventory(); // <--- Endret: Kaller redisplayFilteredInventory
            } else {
                const confirmed = window.confirm("Quantity is 1. Remove product completely?");
                if (confirmed) {
                    await deleteInventoryItem(id);

                    allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                    redisplayFilteredInventory(); // <--- Endret: Kaller redisplayFilteredInventory
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
                redisplayFilteredInventory(); // <--- Endret: Kaller redisplayFilteredInventory

                // <--- NYTT: Statusmelding fra gammel fil
                const statusMessage = document.getElementById("status-message");
                if (statusMessage) { // <--- NYTT: Lagt til sjekk for eksistens
                    statusMessage.textContent = "Product removed.";
                    statusMessage.style.display = "block";
                    setTimeout(() => {
                        statusMessage.style.display = "none";
                        statusMessage.textContent = "";
                    }, 3000);
                }
                // <--- SLUTT NYTT
            }
        });

        inventoryTable.appendChild(row);
    });
}

async function deleteInventoryItem(itemId) {
    try {
        const user = auth.currentUser;
        if (!user) { // <--- NYTT: Brukersjekk for robusthet
            console.error("No user is logged in to delete this element");
            return;
        }
        const userId = user.uid;

        await deleteDoc(doc(db, "users", userId, "userInventory", itemId));
        console.log(`Element with ID ${itemId} is deleted.`);
        clearUserInventoryCache(userId); // <--- NYTT: Kall til clearUserInventoryCache

    } catch (error) {
        console.error("Error occured when deleting element:", error);
    }
}

async function updateItemQuantity(itemId, newQuantity) {
    try {
        const user = auth.currentUser;
        if (!user) { // <--- NYTT: Brukersjekk for robusthet
            console.error("No user is logged in to update element");
            return;
        }
        const userId = user.uid;

        await updateDoc(doc(db, "users", userId, "userInventory", itemId), {
            quantity: newQuantity
        });
        console.log(`Updated quantity for ${itemId} til ${newQuantity}.`);
        clearUserInventoryCache(userId); // <--- NYTT: Kall til clearUserInventoryCache

    } catch (error) {
        console.error("Error occured when updating quantity:", error);
    }
}
