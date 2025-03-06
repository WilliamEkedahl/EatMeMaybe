document.addEventListener("DOMContentLoaded", () => {
    loadCSV();
    document.getElementById("search-bar").addEventListener("input", filterItems);
    document.getElementById("category-dropdown").addEventListener("change", filterItems);
});

let products = [];

async function loadCSV() {
    try {
        const response = await fetch("../products.csv");
        const data = await response.text();
        products = data.split("\n").slice(1).map(row => {
            const [name, category] = row.split(",").map(item => item.trim());
            return { name, category };
        });
        displayProducts(products);
    } catch (error) {
        console.error("Error loading CSV:", error);
    }
}

function displayProducts(filteredProducts) {
    document.getElementById("product-list").innerHTML = filteredProducts.map(product => `
        <tr onclick="openModal('${product.name}', '${product.category}')">
            <td>${product.name}</td>
            <td>${product.category}</td>
        </tr>
    `).join('');
}

function filterItems() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const category = document.getElementById("category-dropdown").value;
    displayProducts(products.filter(product =>
        (!category || product.category === category) &&
        (!query || product.name.toLowerCase().includes(query))
    ));
}

function openModal(name, category) {
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-category').textContent = category;
    
    const modalOverlay = document.getElementById('product-modal');
    modalOverlay.classList.add('show');
    modalOverlay.style.visibility = 'visible';
}

function closeModal() {
    const modalOverlay = document.getElementById('product-modal');
    modalOverlay.classList.remove('show');
    
    setTimeout(() => {
        modalOverlay.style.visibility = 'hidden';
    }, 300);
}

document.getElementById('product-modal').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeModal();
});

function changeQuantity(amount) {
    let input = document.getElementById('quantity-input');
    input.value = Math.max(1, parseInt(input.value) + amount);
}