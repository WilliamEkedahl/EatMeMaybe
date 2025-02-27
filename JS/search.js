document.addEventListener("DOMContentLoaded", () => {
    loadCSV();
});

let products = []; // Lagre CSV-data her

async function loadCSV() {
    try {
        const response = await fetch("../data.csv"); // Endre sti om nødvendig
        const data = await response.text();
        parseCSV(data);
    } catch (error) {
        console.error("Feil ved lasting av CSV:", error);
    }
}

function parseCSV(data) {
    const rows = data.split("\n").slice(1); // Fjerner header
    products = rows.map(row => {
        const [name, category, expiration] = row.split(",");
        return { name, category, expiration };
    });
    displayProducts(products);
}

function displayProducts(filteredProducts) {
    const tableBody = document.getElementById("product-list");
    tableBody.innerHTML = ""; // Tømmer tidligere rader

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.expiration}</td>
        `;
        tableBody.appendChild(row);
    });
}

function filterItems() {
    const searchQuery = document.getElementById("search-bar").value.toLowerCase();
    const selectedCategory = document.getElementById("category-dropdown").value;

    const filtered = products.filter(product => 
        (selectedCategory === "" || product.category === selectedCategory) &&
        (searchQuery === "" || product.name.toLowerCase().includes(searchQuery))
    );

    displayProducts(filtered);
}

// Koble filterfunksjonen til søkefeltet
document.getElementById("search-bar").addEventListener("input", filterItems);
document.getElementById("category-dropdown").addEventListener("change", filterItems);
