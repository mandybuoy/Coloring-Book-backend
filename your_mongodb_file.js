require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set in the environment variables");
  process.exit(1);
}

console.log("Masked URI:", uri.replace(/:([^:@]{8})[^:@]*@/, ':$1****@'));

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
      db = client.db("coloring-book-generator");
      bucket = new GridFSBucket(db);
      console.log("Database and bucket initialized");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      if (error.result && error.result.connection) {
        console.error("Connection details:", error.result.connection);
      }
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

async function saveImageToMongoDB(imageBuffer, filename) {
  const { bucket } = await connectToDatabase();
  
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename);
      
      uploadStream.on('error', (error) => {
        console.error(`Error in upload stream: ${error}`);
        reject(error);
      });
      
      uploadStream.on('finish', (result) => {
        console.log(`Successfully saved image ${filename} to MongoDB with ID: ${result._id}`);
        resolve(result._id.toString());
      });

      uploadStream.end(imageBuffer);
    });
  } catch (error) {
    console.error("Error saving image to MongoDB:", error);
    throw error;
  }
}

async function getImageFromMongoDB(imageId) {
  const { bucket } = await connectToDatabase();
  
  try {
    console.log('Attempting to open download stream for ID:', imageId);
    const downloadStream = bucket.openDownloadStream(new ObjectId(imageId));
    const chunks = [];
    
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    
    if (chunks.length === 0) {
      console.error('No chunks found for ID:', imageId);
      throw new Error('No image data found');
    }
    
    const buffer = Buffer.concat(chunks);
    console.log('Image retrieved successfully, size:', buffer.length);
    return buffer;
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
