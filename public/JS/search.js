import { auth, db } from "./firestore.js"
import { 
    collection,  
    getDocs, 
    addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { clearUserInventoryCache } from "./cache.js";

// INIT 
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();
});

// VARIABLER 
let products = [];
let selectedProduct = { name: "", category: "" };
let currentSuggestion = "";

const CACHE_KEY = "products";
const CACHE_TIME_KEY = "products_cache_time";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const productsCollectionRef = collection(db, "products")

// UI INIT 
function initializeUI() {
    loadProducts();

    //Modal2 (custom product modal)
    document.getElementById('add-new-product-btn').addEventListener('click', openModal2);
    document.getElementById('custom-modal-close-btn2').addEventListener('click', closeModal2);
    document.getElementById("custom-decrease-btn").addEventListener("click", () => changeCustomQuantity(-1));
    document.getElementById("custom-increase-btn").addEventListener("click", () => changeCustomQuantity(1));
    document.getElementById('custom-product-modal2').addEventListener('click', function(e) {
        if (e.target === this) closeModal2();
    });

    document.getElementById("search-bar").addEventListener("input", filterItems);
    document.getElementById("category-dropdown").addEventListener("change", filterItems);
    document.getElementById("search-btn").addEventListener("click", filterItems);

    document.getElementById("search-bar").addEventListener("input", showGhostSuggestion);
    document.getElementById("search-bar").addEventListener("keydown", acceptGhostSuggestion);

    document.getElementById("add-custom-product-btn").addEventListener("click", addNewProductToFirestore);
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

//  DATAHÅNDTERING AV FIRESTORE PRODUCTS TIL CACHE LAGRING
    async function loadProducts() {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) < CACHE_TTL) {
        console.log("Laster produkter fra cache");
        products = JSON.parse(cached);
        displayProducts(products);
        return;
    }

    try {
        console.log("Henter produkter fra Firestore");
        const snapshot = await getDocs(productsCollectionRef);
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        products.sort((a, b) => {
            if (a.category.toLowerCase() < b.category.toLowerCase()) return -1;
            if (a.category.toLowerCase() > b.category.toLowerCase()) return 1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });

        displayProducts(products);
        localStorage.setItem(CACHE_KEY, JSON.stringify(products));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());

    } catch (error) {
        console.error("Feil ved henting fra Firestore:", error);
    }
}

/**unction clearProductCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
}*/

// DISPLAY
function displayProducts(items) {
    const list = document.getElementById("product-list");
    list.innerHTML = "";

    // Kartlegger kategori til bilde
    const categoryIcons = {
        "Fruits and Vegetables": "../MEDIA/vegetable.png",
        "Cooling Products": "../MEDIA/fridge.png",
        "Frozen Products": "../MEDIA/frozen.png",
        "Dry Products": "../MEDIA/spices.png"
    };

    items.forEach(({ name, category }) => {
        const row = document.createElement("tr");

        // Finn riktig ikon, eller bruk en fallback
        const iconPath = categoryIcons[category] || "../MEDIA/grocery-cart.png";

        row.innerHTML = `
            <td>
                <img src="${iconPath}" alt="${category}" class="category-icon">
                ${category}
            </td>
            <td>${name}</td>
            <td>
                <button class="select-button" type="button">Select</button>
            </td>
        `;

        // Åpner modal ved klikk på hele raden eller knappen
        row.querySelector(".select-button").addEventListener("click", (e) => {
            e.stopPropagation(); // Hindrer dobbel modal-åpning
            openModal(name, category);
        });

        row.addEventListener("click", () => openModal(name, category));

        list.appendChild(row);
    });

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

function filterItems() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const category = document.getElementById("category-dropdown").value;

    const filtered = products.filter(({ name, category: cat }) =>
        (!category || cat === category) &&
        (!query || name.toLowerCase().includes(query))
    );

    displayProducts(filtered);
}

// GHOST AUTOCOMPLETE 
function showGhostSuggestion() {
    const input = document.getElementById("search-bar");
    const ghost = document.getElementById("ghost-suggestion");
    const query = input.value.toLowerCase().trim();

    if (!query || products.length === 0) {
        ghost.textContent = "";
        currentSuggestion = "";
        return;
    }

    const match = products
        .map(p => p.name)
        .find(name => name.toLowerCase().startsWith(query));

    if (match) {
        ghost.innerHTML = `<span class="typed">${input.value}</span>${match.slice(query.length)}`;
        currentSuggestion = match;
    } else {
        ghost.textContent = "";
        currentSuggestion = "";
    }
}

function acceptGhostSuggestion(e) {
    if ((e.key === "ArrowRight" || e.key === "Tab") && currentSuggestion) {
        e.preventDefault();
        document.getElementById("search-bar").value = currentSuggestion;
        document.getElementById("ghost-suggestion").textContent = "";
        currentSuggestion = "";
        filterItems();
    }
}

// MODAL 
function openModal(name, category) {
    selectedProduct = { name, category };

    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-category').textContent = category;
    document.getElementById('quantity-input').value = 1;

    document.getElementById('product-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('show');
}

function changeQuantity(amount) {
    const input = document.getElementById('quantity-input');
    input.value = Math.max(1, parseInt(input.value) + amount);
}

function changeCustomQuantity(amount) {
    const input = document.getElementById('custom-quantity');
    input.value = Math.max(1, parseInt(input.value) + amount);
}

// PRODUKTHÅNDTERING 
async function addNewProductToFirestore() {
    const nameInput = document.getElementById('custom-product-name2');
    const categorySelect = document.getElementById('product-category2');

    const name = nameInput.value.trim();
    const category = categorySelect.value;

    if (!name || !category) {
        showMessageModal("Please enter both a name and select a category.");
        return;
    }

    const product = { name, category, quantity:1, addedAt: new Date() };

    try {
        const user = auth.currentUser;
        if(!user){
            showMessageModal("Må være logget på for dette!");
            return;
        }
        const userId = user.uid;

        const userInventoryCollectionRef = collection(db, "users", userId, "userInventory");
        const docRef = await addDoc(userInventoryCollectionRef, product);
        console.log("Added product with ID:", docRef.id);
        showMessageModal("Product added successfully!");
        clearUserInventoryCache(userId); //for å oppdatere i index

        nameInput.value = "";
        categorySelect.value = "";

        //clearProductCache(); går ut pga vi ikke legger til products collection lenger.. for nå
        //loadProducts();      

    } catch (error) {
        console.error("Error adding new product:", error);
        showMessageModal("Failed to add product. Please try again.");
    }
}

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
        const user = auth.currentUser;
        if(!user){
            showMessageModal("Må være logget på for dette!");
            return;
        }
        const userId = user.uid;
        
        const userInventoryCollectionRef = collection(db, "users", userId, "userInventory");
        const docRef = await addDoc(userInventoryCollectionRef, product);
        console.log("Added product with ID:", docRef.id);
        showMessageModal("Product added successfully!");
        clearUserInventoryCache(userId); //for å oppdatere i index

    } catch (err) {
        console.error("Failed to add product:", err);
        showMessageModal("Something went wrong. Please try again.");
    }
}

// MODAL MELDINGER 
function showMessageModal(message) {
    const modal = document.getElementById('custom-modal');
    const messageElement = document.getElementById('modal-message');

    messageElement.textContent = message;
    modal.classList.add('show');

    setTimeout(() => {
        modal.classList.remove('show');
    }, 2000);
}


function hideSidebar() {
    document.getElementById("sidebar").classList.add("hidden");
}
function showSidebar() {
    document.getElementById("sidebar").classList.remove("hidden");
}


function openModal2() {
 document.getElementById('custom-product-modal2').classList.add('show');
}

function closeModal2() {
 document.getElementById('custom-product-modal2').classList.remove('show');
}
