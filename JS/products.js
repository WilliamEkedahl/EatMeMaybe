/*
dummyFoodData is an array of objects we add to our Firestore database. 
For now we have "name" and "category".
The data will be added into our "products" collection.
*/ 
const dummyFoodData = [
    {
      name: "Kebab",
      category: "Digg"
    },
    {
      name: "Sushi Platter",
      category: "Seafood"
    },
    {
      name: "Taco Trio",
      category: "Mexican"
    },
    {
      name: "Pad Thai",
      category: "Asian"
    },
    {
      name: "Chocolate Cake",
      category: "Dessert"
    }
  ];
  
/*
addDummyData () will check if "products" collection is empty or not first.
const productsSnapshot will check for only one single document to conclude if the collection is empty. 
If empty it will send a message to the console that the "products" collection is empty, and then begin to add the dummy data
by looping through each "foodItem" from the "dummyFoodData".
Since we have not declared unique id's for each food item, firestore will do it automatically.
"const docRef = await db.collection("products").add(foodItem);". 'await' is used since adding to firestore is a asynchronous operation 
(a independent process and do not rely on other processes).
If the collection already has data, it skips over the data addition
*/
  async function addDummyData() {
    const productsSnapshot = await db.collection("products").limit(1).get();
  
    if (productsSnapshot.empty) {
      console.log("Products collection is empty. Adding dummy data");
      for (const foodItem of dummyFoodData) {
        try {
          const docRef = await db.collection("products").add(foodItem);
          console.log("Added document with ID:", docRef.id);
        } catch (error) {
          console.error("Error adding document:", error);
        }
      }
      console.log("Dummy data added successfully");
    } else {
      console.log("Products collection already contains data");
    }
  }

  addDummyData();