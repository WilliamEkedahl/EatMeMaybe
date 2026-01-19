
/**
 * @author Atle
 * @author Martin U
 * @author Marius
 */

/**
 * Loads Firebase login and database setup.
 * Gets functions to read from and write to the database.
 * Also brings in a tool to clear saved inventory data.
 */
import { auth, db } from "./firestore.js"
import { collection, addDoc, TimeStamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { clearUserInventoryCache, loadProducts, getCachedProducts } from "./cache.js";

// Waits until the webpage is fully loaded, then runs the main setup function
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
});


/**
 * Prepares the UI when the page finishes loading.
 * Loads and shows products, and adds event listeners.
 * Handles search, filtering, modals, and quantity buttons.
 * Also sets up the mobile sidebar menu.
 */
async function initializeUI() {
  
    const products = await loadProducts();
    displayProducts(products);

    document.getElementById('add-new-product-btn').addEventListener('click', openModal2);
    document.getElementById('custom-modal-close-btn2').addEventListener('click', closeModal2);
    document.getElementById("custom-decrease-btn").addEventListener("click", () => changeCustomQuantity(-1));
    document.getElementById("custom-increase-btn").addEventListener("click", () => changeCustomQuantity(1));
    document.getElementById('custom-product-modal2').addEventListener('click', function(e) {
        if (e.target === this) closeModal2();
    });

    document.getElementById("search-bar").addEventListener("input", filterItems);
    document.getElementById("category-dropdown").addEventListener("change", filterItems);

    document.getElementById("search-bar").addEventListener("input", showGhostSuggestion);
    document.getElementById("search-bar").addEventListener("keydown", acceptGhostSuggestion);

    document.getElementById("add-custom-product-btn").addEventListener("click", addCustomProductToInventory);
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("decrease-btn").addEventListener("click", () => changeQuantity(-1));
    document.getElementById("increase-btn").addEventListener("click", () => changeQuantity(1));

    document.getElementById("product-modal").addEventListener("click", function (e) {
        if (e.target === e.currentTarget) closeModal();
    });

    document.querySelector('.add-product-btn').addEventListener('click', addProductToInventory);
}
 
/**
 * Shows the list of products in the table on the page.
 * Adds icons for categories and "Select" buttons to each.
 * Clicking a row or button opens the product details modal.
 */
function displayProducts(items) {
    const list = document.getElementById("product-list");
    list.innerHTML = "";

    const categoryIcons = {
        "Fruits and Vegetables": "MEDIA/vegetable.png",
        "Cooling Products": "MEDIA/fridge.png",
        "Frozen Products": "MEDIA/frozen.png",
        "Dry Products": " MEDIA/spices.png"
    };

    items.forEach(({ name, category }) => {
        const row = document.createElement("tr");

        const iconPath = categoryIcons[category] || "../MEDIA/grocery-cart.png";

        row.innerHTML = `
            <td>${name}</td>
            <td>
                <img src="${iconPath}" alt="${category}" class="category-icon">
                ${category}
            </td>
            <td>
                <button class="select-button" type="button">Select</button>
            </td>
        `;

        row.querySelector(".select-button").addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(name, category);
        });

        row.addEventListener("click", () => openModal(name, category));

        list.appendChild(row);
    });
}

/**
 * Filters products by search text and chosen category.
 * Shows products that start with the search and match the category.
 * Sorts results alphabetically if searching.
 * Updates the product list display.
 */
function filterItems() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const category = document.getElementById("category-dropdown").value;

    const allProducts = getCachedProducts(); // Get products from cache.js

    const filtered = allProducts.filter(({ name, category: cat }) =>
        (!category || cat === category) &&
        (!query || name.toLowerCase().startsWith(query))
    );

    if (query) {
        filtered.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    }

    displayProducts(filtered);
}

/**
 * Shows a faint autocomplete suggestion in the search box.
 * Finds the first product name starting with what the user typed.
 * Displays the suggestion after the typed text.
 * Updates currentSuggestion to be used if accepted.
 * Clears suggestion if no match or input is empty.
 */

let currentSuggestion = ""; // Stores the currently suggested product name (used for autocomplete functionality)

/**
 * Displays a "ghost" suggestion in the search bar based on cached product names.
 * This visually autocompletes the user's input without changing the actual value.
 */
function showGhostSuggestion() {
    const input = document.getElementById("search-bar"); // Get references to the input field and the ghost suggestion container
    const ghost = document.getElementById("ghost-suggestion");
    const query = input.value.toLowerCase().trim();// Normalize the user's input: convert to lowercase and remove extra whitespace

    const allProducts = getCachedProducts(); // Retrieve the list of product objects from a local cache (from cache.js)

    if (!query || allProducts.length === 0) {    // If the input is empty or there are no products, clear any ghost suggestion and exit
        ghost.textContent = "";
        currentSuggestion = "";
        return;
    }

    const match = allProducts // Try to find the first product name that starts with the user's input
        .map(p => p.name) // "This line iterates through the entire allProducts array (which contains objects for each product) and extracts only the names (name) from each product object."
        .find(name => name.toLowerCase().startsWith(query));  // "This line goes through the list of product names (which we just created with .map) and looks for the first name that starts with the user's input (query)."

    if (match) {
         // If a match is found, visually display the suggestion:
        // - Highlight the typed part
        // - Append the rest of the suggestion in lighter style (CSS handles appearance)
        ghost.innerHTML = `<span class="typed">${input.value}</span>${match.slice(query.length)}`;
        currentSuggestion = match;  // Update the currentSuggestion for potential use in other logic (e.g., autocomplete on Enter)
    } else {  // If no match is found, clear the ghost suggestion
        ghost.textContent = "";
        currentSuggestion = "";
    }
}


/**
 * @author Marius
 * When user presses Tab or Right Arrow, fills search with the suggestion.
 * Replaces input with currentSuggestion and stops default key action.
 * Clears the suggestion and updates the product list to match.
 */
function acceptGhostSuggestion(e) {
    if ((e.key === "ArrowRight" || e.key === "Tab") && currentSuggestion) {
        e.preventDefault();
        document.getElementById("search-bar").value = currentSuggestion;
        document.getElementById("ghost-suggestion").textContent = "";
        currentSuggestion = "";
        filterItems();
    }
}

/**
 * Adds chosen product and amount to the logged-in user's inventory in Firestore.
 * Checks if quantity is valid and user is logged in before saving.
 * Clears cached data and shows success or error alerts.
 * Closes modal only if the product was added without errors.
 */

let selectedProduct = { name: "", category: "" };

async function addProductToInventory() {
    const quantityInput = document.getElementById('quantity-input');
    const quantity = parseInt(quantityInput.value);

    const { name, category } = selectedProduct;

    if (!name || !category || quantity < 1) {
        showMessageModal("Please select a valid quantity.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showMessageModal("You have to be logged in to add products.");
        return;
    }

    const product = {
        name,
        category,
        quantity,
        addedAt: new Date()
    };

    try {
        const userId = user.uid;
        const userInventoryCollectionRef = collection(db, "users", userId, "userInventory");

        const docRef = await addDoc(userInventoryCollectionRef, product);
        console.log("Added product with ID:", docRef.id);
        showMessageModal("Product added successfully!");
        clearUserInventoryCache(userId);
    } catch (err) {
        console.error("Failed to add product:", err);
        showMessageModal("Something went wrong. Please try again.");
    } finally {
        closeModal();
    }
}

/**
 * Opens the product details modal.
 * Sets the selected product's name and category in the modal.
 * Resets quantity input to 1.
 * Shows the modal by adding the 'show' class.
 */
function openModal(name, category) {
    selectedProduct = { name, category };

    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-category').textContent = category;
    document.getElementById('quantity-input').value = 1;

    document.getElementById('product-modal').classList.add('show');
}

/**
 * Closes the product details modal.
 * Simply removes the 'show' class from the modal element, hiding it from view.
 */
function closeModal() {
    document.getElementById('product-modal').classList.remove('show');
}

/**
 * Adjusts the quantity value in the product modal.
 * Adds or subtracts the given amount but ensures the quantity never goes below 1.
 */
function changeQuantity(amount) {
    const input = document.getElementById('quantity-input');
    input.value = Math.max(1, parseInt(input.value) + amount);
}

/**
 * Adds a new custom product to the user's inventory.
 * Validates input fields, checks user login, then writes product data to Firestore.
 * Clears input fields, closes modal, and shows success/error messages.
 * Also clears local cache for user inventory after adding.
 */
async function addCustomProductToInventory() {
    const nameInput = document.getElementById('custom-product-name2');
    const categorySelect = document.getElementById('product-category2');
    const quantityInput = document.getElementById("custom-quantity");
    const expirationInput = document.getElementById("custom-expiration-date");

    if (!expirationInput) {
        showMessageModal("Expiration date field is missing.");
        return;
    }

    const expirationValue = expirationInput.value;

    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const quantity = parseInt(quantityInput.value);

    if (!name || !category || isNaN(quantity) || quantity < 1 || !expirationValue){
        showMessageModal("Please enter a name, category and valid quantity, and date.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showMessageModal("You have to be logged in to add products.");
        return;
    }

    // Normalize dates to midnight
    const addedAt = new Date();
    addedAt.setHours(0, 0, 0, 0);

    const expirationDate = new Date(expirationValue);
    expirationDate.setHours(0, 0, 0, 0);


    // Calculate shelf life in days
    const shelfLife = Math.ceil(
        (expirationDate.getTime() - addedAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (shelfLife <= 0) {
        showMessageModal("Expiration date must be after today.");
        return;
    }

    const product = {
        name,
        category,
        quantity,
        addedAt: Timestamp.fromDate(addedAt),
        shelfLife
    };

    try {
        const userId = user.uid;
        const userInventoryCollectionRef = collection(db, "users", userId, "userInventory");

        const docRef = await addDoc(userInventoryCollectionRef, product);
        console.log("Added product with ID:", docRef.id);

        clearUserInventoryCache(userId);

        nameInput.value = "";
        categorySelect.value = "";
        quantityInput.value = "1";
        expirationInput.value = "";

        function openModal2() {
            document.getElementById('custom-product-modal2').classList.add('show');

            // Default expiration = today + 7 days
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);

            document.getElementById("custom-expiration-date").value =
                defaultDate.toISOString().split("T")[0];
        }

        closeModal2();
        showMessageModal("Product added successfully!");

    } catch (error) {
        console.error("Error adding new product:", error);
        showMessageModal("Failed to add product. Please try again.");
    }
}

/**
 * Opens the second custom product modal by adding the 'show' class.
 * This modal allows users to add new custom products manually.
 */
function openModal2() {
 document.getElementById('custom-product-modal2').classList.add('show');
}

/**
 * Closes the second custom product modal by removing the 'show' class.
 */
function closeModal2() {
 document.getElementById('custom-product-modal2').classList.remove('show');
}

/**
 * Adjusts the quantity value in the custom product modal.
 * Similar to changeQuantity but targets the custom product input field.
 * Ensures quantity does not go below 1.
 */
function changeCustomQuantity(amount) {
    const input = document.getElementById('custom-quantity');
    input.value = Math.max(1, parseInt(input.value) + amount);
}

/**
 * Shows a temporary message modal with the given text.
 * Displays the message and automatically hides the modal after 2,5 seconds.
 * I used to show feedback like success or error notifications.
 */ 
function showMessageModal(message) {
    const modal = document.getElementById('custom-modal');
    const messageElement = document.getElementById('modal-message');

    messageElement.textContent = message;
    modal.classList.add('show');

    setTimeout(() => {
        modal.classList.remove('show');
    }, 2500);
}