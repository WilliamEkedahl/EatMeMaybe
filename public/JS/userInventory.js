document.addEventListener("DOMContentLoaded", () => {
    fetchUserInventory();
});

async function fetchUserInventory() {
    try {
        const snapshot = await db.collection("User_Inventory").get();
        const inventoryItems = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const addedAt = data.addedAt?.toDate() || new Date(0);

            // Dynamisk holdbarhet basert på kategori
            let shelfLifeDays = 7; // standardverdi

            if (data.category === "Cooling Articles") {
                shelfLifeDays = 14;
            } else if (data.category === "Frozen Products") {
                shelfLifeDays = 180;
            } else if (data.category === "Fruits and Vegetables") {
                shelfLifeDays = 3;
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
                expirationDate,
                daysLeft,
            });
        });

        // Sorter etter dato, eldste først
        inventoryItems.sort((a, b) => a.daysLeft - b.daysLeft);

        displayUserInventory(inventoryItems);
    } catch (error) {
        console.error("Feil ved henting av brukerens lager:", error);
    }
}

function displayUserInventory(items) {
    const inventoryTable = document.getElementById("inventory-table-body");

    if (!inventoryTable) {
        console.warn("Fant ikke elementet med id 'inventory-table-body'");
        return;
    }

    inventoryTable.innerHTML = "";

    items.forEach(({ id, name, category, quantity, addedAt, daysLeft }) => {
        const row = document.createElement("tr");
    
        let daysLeftClass = "";
        if (daysLeft <= 3) {
            daysLeftClass = ' class="expiring-red"';
        } else if (daysLeft <= 7) {
            daysLeftClass = ' class="expiring-orange"';
        } else {
            daysLeftClass = ' class="expiring-green"';
        }
    
        row.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
            <td>${quantity}</td>
            <td>${addedAt.toLocaleDateString("no-NO")} ${addedAt.toLocaleTimeString("no-NO")}</td>
            <td${daysLeftClass}>${daysLeft === 0 ? "EXPIRED" : daysLeft + " days"}</td>
            <td><button data-id="${id}" class="delete-btn">Remove</button></td>
        `;
    
        inventoryTable.appendChild(row);
    });

    // Legg til event listeners for alle "Remove"-knapper
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async (event) => {
            const itemId = event.target.getAttribute("data-id");
            await deleteInventoryItem(itemId);
            fetchUserInventory(); // Oppdater tabellen etter sletting
        });
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
