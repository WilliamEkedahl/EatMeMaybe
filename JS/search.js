
// Wait until the webpage is fully loaded, then run the main setup function
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
});

// Array for storing all the products loaded from the CSV file
let products = [];

/**
 * The initializeUI function runs when the page is fully loaded and ready.
 * It first loads product data from the CSV file and displays it on the page.
 * Then it sets up all necessary event listeners to make the page interactive:
 *    - Handle user input for search and category filtering.
 *    - Handle modal open/close interactions and quantity changes.
 *    - Handle sidebar menu toggling on mobile.
 */
function initializeUI() {
    fetchAndDisplayFirestore();

    document.getElementById("search-bar").addEventListener("input", filterItems);
    document.getElementById("category-dropdown").addEventListener("change", filterItems);
    document.getElementById("search-btn").addEventListener("click", filterItems);

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("decrease-btn").addEventListener("click", () => changeQuantity(-1));
    document.getElementById("increase-btn").addEventListener("click", () => changeQuantity(1));

    document.getElementById("hide-sidebar-btn").addEventListener("click", hideSidebar);
    document.getElementById("show-sidebar-btn").addEventListener("click", showSidebar);

    document.getElementById("product-modal").addEventListener("click", function (e) {
        if (e.target === e.currentTarget) closeModal();
    });
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
        products = []; // Clear the array before populating with Firestore data
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() }); // Include document ID and data
        });
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products from Firestore:", error);
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
 * The openModal function displays a popup window (called a modal) when the user clicks on a product row.
 * The modal shows the product’s name and category, and gives the user the option to choose a quantity to add.
 * First, it updates the modal content with the correct product information based on what the user chose.
 * Then it shows the modal by applying a CSS class that makes it visible and triggers a fade-in animation.
 */
function openModal(name, category) {
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-category').textContent = category;

    const modal = document.getElementById('product-modal');
    modal.classList.add('show');
}

/**
 * The closeModal function hides the product modal when the user either click the close button or outside the window. 
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

/**
 * The showSidebar function makes the sidebar visible by adding a CSS class to it.
 * It is activated for use on mobile devices and contains a burger menu with page selection options. 
 */
function showSidebar() {
    document.querySelector(".sidebar").classList.add("visible");
}

/**
 * The hideSidebar function hides the sidebar menu by removing the CSS class that makes it visible.
 */
function hideSidebar() {
    document.querySelector(".sidebar").classList.remove("visible");
}
