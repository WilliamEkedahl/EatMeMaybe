document.addEventListener("DOMContentLoaded", () => {
    fetchUserInventory();
});

async function fetchUserInventory() {
    try {
        const snapshot = await db.collection("User_Inventory").get();
        const inventoryItems = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            inventoryItems.push({
                id: doc.id,
                name: data.name,
                category: data.category,
                quantity: data.quantity,
                date: data.addedAt?.toDate() || new Date(0),
            });
        });

        // Sorter etter dato, nyeste først
        inventoryItems.sort((a, b) => a.date - b.date);

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

    items.forEach(({ id, name, category, quantity, date }) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
            <td>${quantity}</td>
            <td>${date.toLocaleDateString("no-NO")} ${date.toLocaleTimeString("no-NO")}</td>
            <td><button data-id="${id}" class="delete-btn">Slett</button></td>
        `;

        inventoryTable.appendChild(row);
    });

    // Legg til event listeners for alle "Slett"-knapper
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
