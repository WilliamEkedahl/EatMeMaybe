// Wait until the webpage is fully loaded, then run the main setup function
document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
});

/**
 Function to read data from a CSV file and add it to the Firestore "products" collection
 using batched writes.
 */
async function importCSVDataToFirestore(csvFilePath) {
  try {
    const response = await fetch(csvFilePath); //Trying to fetch the csv file products.csv
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status}`);
    }
    const csvText = await response.text(); // Reads the csv file

    const lines = csvText.split('\n').slice(1); // Skip header data (which is name and category)

    const productsSnapshot = await db.collection("products").limit(1).get(); // Tries to see if the collection migt be empty by checking if one document exists

    if (productsSnapshot.empty) {
      console.log("Products collection is empty. Importing data from CSV");

      let batch = db.batch(); // Here it creates a batch write and is useful since we have a lot of products from csv
      let count = 0; // just to keep track off how many products being written in the batch

      for (let i = 0; i < lines.length; i++) { // Loops through each line in the csv data
        const line = lines[i].trim(); // Removes whitespace
        if (!line) continue; // Skips lines that are empty

        const [name, category, ...rest] = line.split(','); // Gets the individual products by splitting the comma. The 'rest' is there incase we want more fields other than name, category

        // If both name and category exists, it will proceed to add the product to Firestore
        if (name && category) {
          const productRef = db.collection("products").doc(); // Create new doc reference in "products" collection and auto generated id
          const productData = {
            name: name.trim(),
            category: category.trim(),
          };

          batch.set(productRef, productData); // Stores the doc reference and product data 
          count++;

          // There is a maximum of 500 documents per batch, so when we have 500 it will start a new batch after commiting to Firestore 
          if (count === 500) {
            await batch.commit();
            console.log(`Committed batch of 500 at line ${i + 1}`);
            batch = db.batch(); // Starts a new batch
            count = 0;
          }
        } else {
          console.warn("Skipping line due to missing name or category:", line);
        }
      }

      // After all lines are read, it will commit the remaining products
      if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count}`);
      }

      console.log("CSV data imported successfully to Firestore.");
    } else {
      console.log("Products collection already contains data. Skipping CSV import.");
    }
  } catch (error) {
    console.error("Error during CSV import:", error);
  }
}

const csvFilePath = '/products.csv';

// Starts the import
importCSVDataToFirestore(csvFilePath);
