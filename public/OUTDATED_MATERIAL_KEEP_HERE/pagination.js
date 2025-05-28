let pageSize = 20;          // Hvor mange produkter som skal vises per side
let currentPage = 1;        // Holder styr på hvilken side vi er på nå
let lastVisibleDoc = null;  // Dokumentet som var siste på forrige side (for å hente neste side)
let firstVisibleDoc = null; // Dokumentet som var første på forrige side (for å hente forrige side)
let isFirstPage = true;     // Vet om vi er på første side (kan brukes til ekstra logikk)

async function loadPaginatedProducts(next = true) {
    // Lager en spørring som henter produkter sortert alfabetisk på navn, begrenset til pageSize
    let query = db.collection("products").orderBy("name").limit(pageSize);

    // Hvis vi skal hente neste side, starter vi etter siste dokument på nåværende side
    if (next && lastVisibleDoc) {
        query = query.startAfter(lastVisibleDoc);
    } 
    // Hvis vi skal hente forrige side, henter vi side som ender før første dokument, og tar de siste i den gruppen
    else if (!next && firstVisibleDoc) {
        query = query.endBefore(firstVisibleDoc).limitToLast(pageSize);
    }

    try {
        const snapshot = await query.get();  // Henter data fra Firestore basert på spørringen

        if (!snapshot.empty) {
            // Oppdater referanser til første og siste dokument på siden vi hentet
            firstVisibleDoc = snapshot.docs[0];
            lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

            // Lager et array med produktene vi hentet, inkl. id og data
            const pageItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            displayProducts(pageItems);  // Viser produktene i tabellen 

            // Oppdaterer tekst som viser nåværende side
            document.getElementById("current-page").textContent = `Page ${currentPage}`;
        }

        // Deaktiverer knapp for forrige side hvis vi er på første side
        document.getElementById("prev-page-btn").disabled = currentPage === 1;
        // Deaktiverer knapp for neste side hvis det var færre produkter enn pageSize (altså siste side)
        document.getElementById("next-page-btn").disabled = snapshot.size < pageSize;

    } catch (error) {
        console.error("Pagination error:", error);  // Logger feil hvis noe går galt
    }
}

// Når bruker klikker på neste-knappen
document.getElementById("next-page-btn").addEventListener("click", () => {
    currentPage++;           // Øker sidenummeret
    loadPaginatedProducts(true);  // Laster neste side
});

// Når bruker klikker på forrige-knappen
document.getElementById("prev-page-btn").addEventListener("click", () => {
    if (currentPage > 1) {   // Hvis vi ikke er på første side
        currentPage--;       // Går tilbake en side
        loadPaginatedProducts(false); // Laster forrige side
    }
});

// Når siden er ferdig lastet i nettleseren, last første side med produkter
window.addEventListener("DOMContentLoaded", () => {
    loadPaginatedProducts(true);  // Starter på første side
});

//MÅ ENDRE PÅ FILTER I SEARCH FOR Å KUNNE SØKE PÅ MER ENN BARE PRODUKTER I ARRAYET. SOM HAR BARE 20 PRODUKTER PGA PAGINATION.