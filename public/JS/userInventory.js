/* @author MartinN, cache and firestore: MartinU */

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
    // Add event listeners for category buttons
    const categoryButtons = document.querySelectorAll(".category-btn");

    // Set "All Products" as the default active button on load
    const defaultBtn = document.querySelector('.category-btn[data-category=""]');
    if (defaultBtn) defaultBtn.classList.add("active");

    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Update active button
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.getAttribute("data-category");
            filterInventoryByCategory(category);
        });
    });
});

// 1 day in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

let allInventoryItems = [];         // Store for all products from Firestore
let activeCategoryFilter = null;    // Active category for filtering
let userInventoryRef = null;        // Reference to user's Firestore inventory

// Shelf life (in days) for each category
const categoryShelfLives = {
    "Cooling Products": 7,
    "Frozen Products": 179,
    "Fruits and Vegetables": 5,
    "Dry Products": 239
};

// Looking for whether a user is logged in or not
auth.onAuthStateChanged(async user => {
    if (user) {
        const userId = user.uid;
        userInventoryRef = collection(doc(db, "users", userId), "userInventory");
        fetchUserInventory(userId);

        // Fetch the username from firestore and update the heading h2
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
        displayUserInventory([]); // Clear the table if no user is logged in
    }
});

// Fetch user's inventory, first from cache if possible
async function fetchUserInventory(userId) {
    if (!userInventoryRef) {
        console.error("Cannot fetch inventory: userInventoryRef is not set (no user is logged in?).");
        displayUserInventory([]);
        return;
    }

    const userCacheKey = `userInventory_${userId}`;
    const userCacheTimeKey = `userInventory_cache_time_${userId}`;
    const cached = localStorage.getItem(userCacheKey);
    const timestamp = localStorage.getItem(userCacheTimeKey);
    const now = Date.now();

    // Check if cached inventory exists and is not too old
    if (cached && timestamp && now - parseInt(timestamp) < CACHE_TTL) {
        console.log("Loading user inventory from cache", userId);
        allInventoryItems = JSON.parse(cached);

        allInventoryItems.forEach(item => {
            item.addedAt = new Date(item.addedAt);
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

        if (activeCategoryFilter) {
            filterInventoryByCategory(activeCategoryFilter);
        } else {
            displayUserInventory(allInventoryItems);
        }
        return;
    }

    // Fetch inventory from Firestore if no cache
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

        // Sort products by days left, then category, then product name
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

        const emptyMessage = document.getElementById("empty-inventory-message");
        if (allInventoryItems.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
        } else {
            if (emptyMessage) emptyMessage.style.display = "none";
        }

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

// Update active category and filter
function filterInventoryByCategory(category) {
    activeCategoryFilter = category;
    redisplayFilteredInventory();
}

// Display products in active category to prevent having to reload db
function redisplayFilteredInventory() {
    const itemsToDisplay = activeCategoryFilter
        ? allInventoryItems.filter(item => item.category === activeCategoryFilter)
        : allInventoryItems;
    displayUserInventory(itemsToDisplay);
}

// Display the products in the table
function displayUserInventory(items) {
    const inventoryTable = document.getElementById("inventory-table-body");
    const template = document.getElementById("inventory-row-template");
    const emptyMessage = document.getElementById("empty-inventory-message");

    if (emptyMessage) emptyMessage.style.display = "none";

    // Clear existing rows
    while (inventoryTable.firstChild) {
        inventoryTable.removeChild(inventoryTable.firstChild);
    }

    if (items.length === 0) {
        if (emptyMessage) emptyMessage.style.display = "block";
        return; 
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

        // Color indicator for expiration status
        if (daysLeft <= 3) {
            tdDaysLeft.classList.add("expiring-red");
        } else if (daysLeft <= 7) {
            tdDaysLeft.classList.add("expiring-orange");
        } else {
            tdDaysLeft.classList.add("expiring-green");
        }

        // Handle increasing quantity
        increaseBtn.addEventListener("click", async () => {
            const newQuantity = Number(quantity) + 1;
            await updateItemQuantity(id, newQuantity);

            const item = allInventoryItems.find(item => item.id === id);
            if (item) item.quantity = newQuantity;

            redisplayFilteredInventory(); // <--- Endret: Kaller redisplayFilteredInventory
        });

        // Handle decreasing quantity
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

        // Handle deleting product
        deleteBtn.setAttribute("data-id", id);
        deleteBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("Are you sure you want to remove this product?");
            if (confirmed) {
                await deleteInventoryItem(id);

                allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                redisplayFilteredInventory();

                const statusMessage = document.getElementById("status-message");
                if (statusMessage) {
                    statusMessage.textContent = "Product removed.";
                    statusMessage.style.display = "block";
                    setTimeout(() => {
                        statusMessage.style.display = "none";
                        statusMessage.textContent = "";
                    }, 3000);
                }
            }
        });

        inventoryTable.appendChild(row);
    });
}

// Delete a product from Firestore and update cache
async function deleteInventoryItem(itemId) {
    try {
        const user = auth.currentUser;
        if (!user) { 
            console.error("No user is logged in to delete this element");
            return;
        }
        const userId = user.uid;

        await deleteDoc(doc(db, "users", userId, "userInventory", itemId));
        console.log(`Element with ID ${itemId} is deleted.`);
        clearUserInventoryCache(userId);

    } catch (error) {
        console.error("Error occured when deleting element:", error);
    }
}

// Update quantity for a product in Firestore and update cache
async function updateItemQuantity(itemId, newQuantity) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user is logged in to update element");
            return;
        }
        const userId = user.uid;

        await updateDoc(doc(db, "users", userId, "userInventory", itemId), {
            quantity: newQuantity
        });
        console.log(`Updated quantity for ${itemId} til ${newQuantity}.`);
        clearUserInventoryCache(userId);

    } catch (error) {
        console.error("Error occured when updating quantity:", error);
    }
}