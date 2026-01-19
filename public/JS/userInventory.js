/**
 * @author Martin N
 * @author Martin U
 * @author Atle
 */

/**
 * Loads Firebase login and database setup.
 * Gets functions to read from and write to the database.
 * Also brings in a tool to clear saved inventory data.
 */
import { auth, db } from "./firestore.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { clearUserInventoryCache } from "./cache.js"; 

// Wait for the DOM content to fully load before executing code
document.addEventListener("DOMContentLoaded", () => {
    // Add event listener for category button
    const categoryButtons = document.querySelectorAll(".category-btn");

    // Set "All Products" as the default active button on load (from category-btn, "empty" = all category)
    const defaultBtn = document.querySelector('.category-btn[data-category=""]');
    if (defaultBtn) defaultBtn.classList.add("active");

    // Add a click event listener to each category button
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // When a button is clicked, remove "active" class from all buttons
            categoryButtons.forEach(b => b.classList.remove("active"));
            // Add the "active" class to the clicked button
            btn.classList.add("active");

            // Get the category associated with the clicked button
            const category = btn.getAttribute("data-category");
            // Filter the inventory by the selected category
            filterInventoryByCategory(category);
        });
    });
});

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


/**
 * @author Martin N
 * @author Martin U
 * Fetch user's inventory, first from cache if possible
 */

async function fetchUserInventory(userId) {
    if (!userInventoryRef) { // Checks if the reference to the user's inventory in Firestore is set.
        console.error("Cannot fetch inventory: userInventoryRef is not set (no user is logged in?).");
        displayUserInventory([]); // Clears the display.
        return;
    }

    // Creates a unique key for storing this user's inventory in local storage
    const userCacheKey = `userInventory_${userId}`;
    // Creates a key for storing the timestamp of when this user's cache was last updated
    const userCacheTimeKey = `userInventory_cache_time_${userId}`; 
    // Tries to get the cached inventory data
    const cached = localStorage.getItem(userCacheKey);
    // Tries to get the cache timestamp
    const timestamp = localStorage.getItem(userCacheTimeKey);
    // Gets the current time
    const now = Date.now(); 
    // Defines the cache's "time to live" (1 day)
    const CACHE_TTL = 24 * 60 * 60 * 1000;

    // Check if cached inventory data exists and is still fresh (not older than CACHE_TTL)
    if (cached && timestamp && now - parseInt(timestamp) < CACHE_TTL) {
        console.log("Loading user inventory from cache", userId);
        allInventoryItems = JSON.parse(cached);

        // Recalculate the days left for each inventory item (since dates may have changed)
        allInventoryItems.forEach(item => {
            item.addedAt = new Date(item.addedAt);
            const shelfLifeDays = item.shelfLife ?? (categoryShelfLives[item.category] ?? 7);
            const expirationDate = new Date(item.addedAt);
            expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expirationDate.setHours(0, 0,
                0, 0);
            const timeDiff = expirationDate.getTime() - today.getTime();
            item.daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        });

        // Show or hide the empty inventory message depending on whether there are items
        const emptyMessage = document.getElementById("empty-inventory-message");
        if (allInventoryItems.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
        } else {
            if (emptyMessage) emptyMessage.style.display = "none";
        }

        // Show the filtered inventory if a category filter is active, otherwise show all items
        if (activeCategoryFilter) {
            filterInventoryByCategory(activeCategoryFilter);
        } else {
            displayUserInventory(allInventoryItems);
        }
        return;
    }

    // Fetch inventory from Firestore if no cache
    try {
        // Get a snapshot of the user's inventory documents from Firestore
        const snapshot = await getDocs(userInventoryRef);
        // Holds the parsed inventory items
        const inventoryItems = [];

        // Loop through each document in the snapshot
        snapshot.forEach(doc => {
            const data = doc.data();
            // Check if 'addedAt' exists and is a valid Firestore Timestamp object
            if (!(data.addedAt && typeof data.addedAt.toDate === "function")) {
                console.warn(`Invalid or missing 'addedAt' for document. ${doc.id}, skips this element.`);
                return; 
            }

            const addedAt = data.addedAt.toDate();
            //testing merge
            // Get shelf life based on category or default to 7 days. Either or basically with the "??"
            let shelfLifeDays = categoryShelfLives[data.category] ?? 7;

            // Calculate the expiration date
            const expirationDate = new Date(addedAt);
            expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

            // Normalize today's date to midnight for consistency
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expirationDate.setHours(0, 0, 0, 0);

            // Calculate the number of days left until the item expires
            const timeDiff = expirationDate.getTime() - today.getTime();
            const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

            // Push the parsed and processed inventory item to the array
            inventoryItems.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                quantity: data.quantity,
                addedAt,
                shelfLife: shelfLifeDays,
                daysLeft,
            });
        });

        // Sort products by days left, then category, then product name
        inventoryItems.sort((a, b) => {
            // Sort first by days left (ascending)
            if (a.daysLeft !== b.daysLeft) {
                return a.daysLeft - b.daysLeft;
            }
            // If daysLeft is the same, sort by category in alphabetical order
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            // If category is also the same, sort by product name
            return a.name.localeCompare(b.name);
        });

        allInventoryItems = inventoryItems;

        // Show or hide the empty inventory message
        const emptyMessage = document.getElementById("empty-inventory-message");
        if (allInventoryItems.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
        } else {
            if (emptyMessage) emptyMessage.style.display = "none";
        }

        // Display the inventory, possibly applying a category filter
        if (activeCategoryFilter) {
            filterInventoryByCategory(activeCategoryFilter);
        } else {
            displayUserInventory(inventoryItems);
        }

        // Stores the processed inventory in localStorage for caching
        localStorage.setItem(userCacheKey, JSON.stringify(inventoryItems));
        // Stores the current timestamp to track cache time
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

// Display products in the active category to avoid reloading from the database
function redisplayFilteredInventory() {
    // If a category filter is active, filter items accordingly; otherwise, show all items
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

    // Clear existing rows in the inventory table
    while (inventoryTable.firstChild) {
        inventoryTable.removeChild(inventoryTable.firstChild);
    }

    // If no items to display, show the empty inventory message and exit
    if (items.length === 0) {
        if (emptyMessage) emptyMessage.style.display = "block";
        return; a
    }

    // For each product, create a table row and populate its data
    items.forEach(({ id, name, category, quantity, addedAt, daysLeft }) => {
        // Use a template for consistent formatting, used in index.html
        const row = template.content.cloneNode(true);

        // Get references to table cells
        const tdName = row.querySelector(".product-name");
        const tdCategory = row.querySelector(".product-category");
        const tdQuantity = row.querySelector(".product-quantity");
        const tdAddedAt = row.querySelector(".product-added-at");
        const tdDaysLeft = row.querySelector(".product-days-left");
        const deleteBtn = row.querySelector(".delete-btn");
        const increaseBtn = row.querySelector(".increase-btn");
        const decreaseBtn = row.querySelector(".decrease-btn");

        // Fill in the product data
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

        // Increase product quantity
        increaseBtn.addEventListener("click", async () => {
            const newQuantity = Number(quantity) + 1;
            await updateItemQuantity(id, newQuantity);

            // Update the item in the local cache
            const item = allInventoryItems.find(item => item.id === id);
            if (item) item.quantity = newQuantity;

            redisplayFilteredInventory(); 
        });

        // Decrease product quantity
        decreaseBtn.addEventListener("click", async () => {
            const currentQuantity = Number(quantity);
            if (currentQuantity > 1) {
                await updateItemQuantity(id, currentQuantity - 1);

                const item = allInventoryItems.find(item => item.id === id);
                if (item) item.quantity = currentQuantity - 1;

                redisplayFilteredInventory();
            } else {
                // If quantity is 1, confirm removal
                const confirmed = window.confirm("Quantity is 1. Remove product completely?");
                if (confirmed) {
                    await deleteInventoryItem(id);

                    // Remove the item from the local cache
                    allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                    redisplayFilteredInventory();
                }
            }
        });

        // Handle deleting a product entirely
        deleteBtn.setAttribute("data-id", id);
        deleteBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("Are you sure you want to remove this product?");
            if (confirmed) {
                await deleteInventoryItem(id);

                // Remove the item from the local cache
                allInventoryItems = allInventoryItems.filter(item => item.id !== id);
                redisplayFilteredInventory();

                // Show a temporary status message to the user
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

        // Finally, add the row to the inventory table
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

        // Delete the document from Firestore
        await deleteDoc(doc(db, "users", userId, "userInventory", itemId));
        console.log(`Element with ID ${itemId} is deleted.`);

        // Clear cache so the next fetch will get the latest data
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

        // Update the quantity in Firestore
        await updateDoc(doc(db, "users", userId, "userInventory", itemId), {
            quantity: newQuantity
        });
        console.log(`Updated quantity for ${itemId} til ${newQuantity}.`);

        // Clear cache so the next fetch will get the latest data
        clearUserInventoryCache(userId);

    } catch (error) {
        console.error("Error occured when updating quantity:", error);
    }
}