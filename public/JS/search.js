
// Wait until the webpage is fully loaded, then run the main setup function
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
});

// Array for storing all the products loaded from the CSV file
let products = [];


let selectedProduct = { name: "", category: "" };


/**
 * The initializeUI function runs when the page is fully loaded and ready.
 * It first loads product data from the CSV file and displays it on the page.
 * Then it sets up all necessary event listeners to make the page interactive:
 *    - Handle user input for search and category filtering.
 *    - Handle modal open/close interactions and quantity changes.
 *    - Handle sidebar menu toggling on mobile.
 */
function initializeUI() {
    //fetchAndDisplayFirestore(); LASTER INN HELE DRITEN FRA FIRESTORE, SE pagination.js

    document.getElementById("search-bar").addEventListener("input", filterItems);
    document.getElementById("category-dropdown").addEventListener("change", filterItems);
    document.getElementById("search-btn").addEventListener("click", filterItems);
    document.getElementById("search-bar").addEventListener("input", showGhostSuggestion);
    document.getElementById("search-bar").addEventListener("keydown", acceptGhostSuggestion);

    /* product*/
    document.getElementById("add-new-product-btn").addEventListener("click", addNewProductToFirestore);

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("decrease-btn").addEventListener("click", () => changeQuantity(-1));
    document.getElementById("increase-btn").addEventListener("click", () => changeQuantity(1));

    document.getElementById("hide-sidebar-btn").addEventListener("click", hideSidebar);
    document.getElementById("show-sidebar-btn").addEventListener("click", showSidebar);

    document.getElementById("product-modal").addEventListener("click", function (e) {
        if (e.target === e.currentTarget) closeModal();
    });

    document.querySelector('.add-product-btn').addEventListener('click', addProductToInventory);

}

/**
 * The fetchAndDisplayCSV function loads the product data from a CSV file and displays it to the user. 
 * It first downloads the CSV-file as a wrapper called a response object.
 * It then takes the text from the object and stores it in a const called "text".
 * The function parseCSV is called on this const, which parses the text into Javascript objects.
 * Finally the displayProducts function is called to display the products to the user in a table.
 * Should there be a problem with these operations, the function catches this and displays a relevant error message. 
 */
async function fetchAndDisplayFirestore() {
    try {
        const snapshot = await db.collection("products").get();
        products = []; 
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() }); 
        });
        products.sort((a, b) => {
    if (a.category.toLowerCase() < b.category.toLowerCase()) return -1;
    if (a.category.toLowerCase() > b.category.toLowerCase()) return 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
});

displayProducts(products);
    } catch (error) {
        console.error("Error fetching products from Firestore:", error);
    }
}

/* mn product*/
async function addNewProductToFirestore() {
    const nameInput = document.getElementById('new-product-name');
    const categorySelect = document.getElementById('new-product-category');

    const name = nameInput.value.trim();
    const category = categorySelect.value;

    if (!name || !category) {
        showMessageModal("Please enter both a name and select a category.");
        return;
    }

    const product = { name, category };

    try {
        await db.collection("products").add(product);
        showMessageModal("Product added successfully!");
        nameInput.value = "";
        categorySelect.value = "";
        fetchAndDisplayFirestore(); // Oppdater produktlisten
    } catch (error) {
        console.error("Error adding new product:", error);
        showMessageModal("Failed to add product. Please try again.");
    }
}



/**
 * The displayProducts function shows the given list of products in a table on the page.
 * It creates one row for each product using HTML, and places it inside the table.
 * The function also makes it possible to click on each row to open a modal by calling the openModal function.
 */
function displayProducts(items) {
    const list = document.getElementById("product-list");
    list.innerHTML = "";

    items.forEach(({ name, category }) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
        `;
        row.addEventListener("click", () => openModal(name, category));
        list.appendChild(row);
    });
}

/**
 * The filterItems function makes it possible for the user to search in the products list based on types or selects.
 * It checks if the product matches the search text and/or the selected category.
 * Only products that match one or both of these will be shown in the table.
 */
function filterItems() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const category = document.getElementById("category-dropdown").value;

    const filtered = products.filter(function({ name, category: cat }) {
        return (!category || cat === category) &&
               (!query || name.toLowerCase().includes(query));
    });

    displayProducts(filtered);
}

let currentSuggestion = "";

async function showGhostSuggestion() {
    const input = document.getElementById("search-bar");
    const ghost = document.getElementById("ghost-suggestion");
    const query = input.value.toLowerCase().trim();

    if (!query) {
        ghost.textContent = "";
        currentSuggestion = "";
        return;
    }

    try {
        const snapshot = await db.collection("products").get();
        const match = [...snapshot.docs]
            .map(doc => doc.data().name)
            .find(name => name.toLowerCase().startsWith(query));

        if (match) {
            ghost.textContent = input.value + match.slice(query.length);
            currentSuggestion = match;
        } else {
            ghost.textContent = "";
            currentSuggestion = "";
        }

    } catch (err) {
        console.error("Ghost autocomplete error:", err);
    }
}

function acceptGhostSuggestion(e) {
    if ((e.key === "ArrowRight" || e.key === "Tab") && currentSuggestion) {
        e.preventDefault();
        document.getElementById("search-bar").value = currentSuggestion;
        document.getElementById("ghost-suggestion").textContent = "";
        currentSuggestion = "";
        filterItems(); // trigger filtrering etter autocomplete
    }
}
/**
 * The openModal function displays a popup window (called a modal) when the user clicks on a product row.
 * The modal shows the product’s name and category, and gives the user the option to choose a quantity to add.
 * First, it updates the modal content with the correct product information based on what the user chose.
 * Then it shows the modal by applying a CSS class that makes it visible and triggers a fade-in animation.
 */
function openModal(name, category) {
    selectedProduct = { name, category };

    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-category').textContent = category;

    document.getElementById('quantity-input').value = 1;
    document.getElementById('product-modal').classList.add('show');
}

/**
 * The closeModal function hides the product modal when the user either clicks the close button or outside the window. 
 * It removes the "show" class for animation, and then hides the modal completely after a short delay.
 */
function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('show');
}

/**
 * The function changeQuantity changes the number in the quantity input field, when the user changes this. 
 * If the user clicks "+" or "−", this adjusts the value up or down, but never below 1 for practical reasons. 
 */
function changeQuantity(amount) {
    const input = document.getElementById('quantity-input');
    input.value = Math.max(1, parseInt(input.value) + amount);
}

/**
 * The addProductToInventory function adds a selected product and quantity to the users inventory collection in Firestore.
 * It first retrieves the quantity value from the user input field and parses it to an integer.
 * The product name and category are extracted from the selectedProduct object.
 * If any of the required fields (name, category, or quantity) are invalid, an alert is shown and the function stops.
 * A product object is then created with the necessary details (name, category, quantity, and timestamp).
 * If the operation is successful, the product is added to the database, and a success message is displayed to the user.
 * If there is an error during the database operation, an error message is displayed instead.
 */
async function addProductToInventory() {
    closeModal();

    const quantityInput = document.getElementById('quantity-input');
    const quantity = parseInt(quantityInput.value);

    const { name, category } = selectedProduct;

    if (!name || !category || quantity < 1) {
        showMessageModal("Please select a valid product and quantity.");
        return;
    }

    const product = {
        name,
        category,
        quantity,
        addedAt: new Date()
    };

    try {
        const doc = await db.collection("User_Inventory").add(product);
        console.log("Added product with ID:", doc.id);
        showMessageModal("Product added successfully!");
    } catch (err) {
        console.error("Failed to add product:", err);
        showMessageModal("Something went wrong. Please try again.");
    }
}

/**
 * The showMessageModal function displays a modal with a custom message.
 * It first retrieves the modal element and the element where the message will be shown.
 * The function sets the text content of the modal to the provided message.
 * The modal is then made visible by adding the .show class to it, which changes its display property.
 * After 2 seconds, the modal will be hidden by removing the .show class, making it disappear.
 */
function showMessageModal(message) {
    const modal = document.getElementById('custom-modal');
    const messageElement = document.getElementById('modal-message');
    
    messageElement.textContent = message;

    modal.classList.add('show');

    setTimeout(() => {
        modal.classList.remove('show');
    }, 2000);
}