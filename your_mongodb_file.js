require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const fs = require('fs').promises;

const uri = `mongodb+srv://mandlechagsocial:${process.env.MONGODB_PASSWORD}@coloring-book-generator.mi5jy.mongodb.net/?retryWrites=true&w=majority&appName=Coloring-Book-Generator`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let bucket;

async function connectToDatabase() {
  if (!db) {
    try {
      await client.connect();
      console.log("Successfully connected to MongoDB!");
      db = client.db("coloring-book-generator"); // Replace with your actual database name
      bucket = new GridFSBucket(db);
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }
  return { db, bucket };
}

async function saveDataToMongoDB(collectionName, data) {
  const { db } = await connectToDatabase();
  const collection = db.collection(collectionName);
  
  try {
    const result = await collection.insertOne(data);
    console.log(`Successfully inserted document with _id: ${result.insertedId}`);
    return result;
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
    throw error;
  }
}

async function saveImageToMongoDB(imagePath, filename) {
  const { bucket } = await connectToDatabase();
  
  try {
    const uploadStream = bucket.openUploadStream(filename);
    const fileBuffer = await fs.readFile(imagePath);
    
    await new Promise((resolve, reject) => {
      uploadStream.end(fileBuffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    console.log(`Successfully saved image ${filename} to MongoDB`);
    return uploadStream.id;
  } catch (error) {
    console.error("Error saving image to MongoDB:", error);
    throw error;
  }
}

async function getImageFromMongoDB(filename) {
  const { bucket } = await connectToDatabase();
  
  try {
    const downloadStream = bucket.openDownloadStreamByName(filename);
    const chunks = [];
    
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error retrieving image from MongoDB:", error);
    throw error;
  }
}

// Example usage
async function exampleUsage() {
  try {
    // Save metadata
    const exampleData = { name: "Example Coloring Book", pages: 10 };
    const metadataResult = await saveDataToMongoDB("coloring_books", exampleData);
    
    // Save image
    const imagePath = './path/to/your/image.png';
    const imageId = await saveImageToMongoDB(imagePath, 'example_image.png');
    
    // Update metadata with image reference
    await saveDataToMongoDB("coloring_books", { 
      _id: metadataResult.insertedId, 
      imageId: imageId 
    });
    
    // Retrieve image
    const imageBuffer = await getImageFromMongoDB('example_image.png');
    console.log("Retrieved image buffer:", imageBuffer);
  } catch (error) {
    console.error("Error in example usage:", error);
  } finally {
    await client.close();
  }
}

// Uncomment the line below to run the example
// exampleUsage();

module.exports = { connectToDatabase, saveDataToMongoDB, saveImageToMongoDB, getImageFromMongoDB };
