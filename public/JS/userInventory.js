document.addEventListener("DOMContentLoaded", () => {
    fetchUserInventory();

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
 
let allInventoryItems = [];
let activeCategoryFilter = null;
 
async function fetchUserInventory() {
    try {
        const snapshot = await db.collection("User_Inventory").get();
        const inventoryItems = [];
 
        snapshot.forEach(doc => {
            const data = doc.data();
            const addedAt = data.addedAt?.toDate() || new Date(0);
 
            // Dynamisk holdbarhet basert på kategori
            let shelfLifeDays = 7; // standardverdi
 
            if (data.category === "Cooling Products") {
                shelfLifeDays = 14;
            } else if (data.category === "Frozen Products") {
                shelfLifeDays = 180;
            } else if (data.category === "Fruits and Vegetables") {
                shelfLifeDays = 3;
            } else if (data.category === "Dry Products") {
                shelfLifeDays = 60;
            } else if (data.category === "Asian") {
                shelfLifeDays = 30;
            }
 
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
            await updateItemQuantity(id, quantity + 1);
            fetchUserInventory();
        });
 
        // Reduser kvantitet
        decreaseBtn.addEventListener("click", async () => {
            if (quantity > 1) {
                await updateItemQuantity(id, quantity - 1);
                fetchUserInventory();
            } else {
                const confirmed = window.confirm("Quantity is 1. Remove product completely?");
                if (confirmed) {
                    await deleteInventoryItem(id);
                    fetchUserInventory();
                }
            }
        });
 
        // Slett produktet
        deleteBtn.setAttribute("data-id", id);
        deleteBtn.addEventListener("click", async () => {
            const confirmed = window.confirm("Are you sure you want to remove this product?");
            if (confirmed) {
                await deleteInventoryItem(id);
                fetchUserInventory();
 
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
        await db.collection("User_Inventory").doc(itemId).delete();
        console.log(`Element med ID ${itemId} er slettet.`);
    } catch (error) {
        console.error("Feil ved sletting av element:", error);
    }
}
 
async function updateItemQuantity(itemId, newQuantity) {
    try {
        await db.collection("User_Inventory").doc(itemId).update({
            quantity: newQuantity
        });
        console.log(`Oppdatert kvantitet for ${itemId} til ${newQuantity}.`);
    } catch (error) {
        console.error("Feil ved oppdatering av kvantitet:", error);
    }
}