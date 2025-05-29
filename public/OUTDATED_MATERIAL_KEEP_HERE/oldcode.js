
// <--- FJERNET DENNE FUNKSJONEN HELT: attachInventoryEventListeners var i gammel fil, men logikken er nå integrert i displayUserInventory
/*
function attachInventoryEventListeners(row, id, quantity) {
    const deleteBtn = row.querySelector(".delete-btn");
    const increaseBtn = row.querySelector(".increase-btn");
    const decreaseBtn = row.querySelector(".decrease-btn");

    increaseBtn.addEventListener("click", async () => {
        const newQuantity = Number(quantity) + 1;
        await updateItemQuantity(id, newQuantity);

        const item = allInventoryItems.find(item => item.id === id);
        if (item) item.quantity = newQuantity;

        redisplayFilteredInventory();
    });

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
}
*/