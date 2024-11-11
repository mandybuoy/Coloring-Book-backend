const express = require("express");
const router = express.Router();
const fal = require("@fal-ai/serverless-client");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const {
  saveImageToMongoDB,
  getImageFromMongoDB,
} = require("../your_mongodb_file");

fal.config({
  credentials: process.env.FAL_API_KEY,
});

// router.post("/generate-image", async (req, res) => {
//   try {
//     const { prompt, image_size } = req.body;
//     console.log("Received request:", { prompt, image_size });

//     const { request_id } = await fal.queue.submit("fal-ai/flux-pro", {
//       input: {
//         prompt,
//         image_size,
//         seed: Math.floor(Math.random() * 1000000),
//         guidance_scale: 3.5,
//         num_images: 1,
//         safety_tolerance: "2",
//       },
//     });

//     console.log("FAL API request submitted, request_id:", request_id);
//     res.json({ request_id });
//   } catch (error) {
//     console.error("Error submitting image generation request:", error);
//     res.status(500).json({
//       error: "Failed to submit image generation request",
//       details: error.message,
//     });
//   }
// });

router.get("/image-result/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fal.queue.result("fal-ai/flux-pro/v1.1", {
        requestId: requestId,
      });

      if (result && result.images && result.images.length > 0) {
        const image = result.images[0];
        const fileName = `image_${Date.now()}.jpg`;

        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        try {
          const imageId = await saveImageToMongoDB(buffer, fileName);
          console.log(`Image saved to MongoDB with ID: ${imageId}`);
          return res.json({
            status: "success",
            image_id: imageId,
            original_url: image.url,
          });
        } catch (error) {
          console.error("Error saving image to MongoDB:", error);
          return res.status(500).json({
            status: "error",
            error: "Failed to save image to MongoDB",
          });
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.error("Error fetching image result:", error);
      if (attempt === maxRetries - 1) {
        return res
          .status(500)
          .json({ status: "error", error: "Failed to fetch image result" });
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
});

// New route to fetch image from MongoDB
router.get("/get-image/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    console.log("Attempting to fetch image with ID:", imageId);

    const imageBuffer = await getImageFromMongoDB(imageId);
    console.log("Image retrieved successfully, size:", imageBuffer.length);
    res.contentType("image/jpeg");
    res.send(imageBuffer);
  } catch (error) {
    console.error("Error retrieving image from MongoDB:", error);
    console.error("Image ID:", req.params.imageId);
    if (error.message === "No image data found") {
      res.status(404).json({ status: "error", error: "Image not found" });
    } else {
      res.status(500).json({
        status: "error",
        error: "Failed to retrieve image from MongoDB",
      });
    }
  }
});

router.post("/generate-image", async (req, res) => {
  try {
    const { prompt, image_size } = req.body;
    console.log("Received request:", { prompt, image_size });

    // Submit the request and wait for the result
    const { request_id } = await fal.queue.submit("fal-ai/flux-pro/v1.1", {
      input: {
        prompt,
        image_size,
        seed: Math.floor(Math.random() * 1000000),
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: "2",
      },
    });

    console.log("FAL API request submitted, request_id:", request_id);

    // Poll for the result
    const maxRetries = 30;
    const retryDelay = 3000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fal.queue.result("fal-ai/flux-pro/v1.1", {
          requestId: request_id,
        });

        if (result && result.images && result.images.length > 0) {
          const image = result.images[0];

          // Fetch the image data
          const response = await fetch(image.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }

          // Get image as base64
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Image = buffer.toString("base64");

          console.log("Image generated successfully!");
          return res.json({
            status: "success",
            image: `data:image/jpeg;base64,${base64Image}`,
          });
        }
      } catch (error) {
        // Check if the error is just "Request is still in progress"
        if (
          error.status === 400 &&
          error.body?.detail === "Request is still in progress"
        ) {
          console.log("Request still in progress, waiting...");
        } else {
          console.error("Error processing image:", error);
          if (attempt === maxRetries - 1) {
            return res.status(500).json({
              status: "error",
              error: "Failed to process image request",
            });
          }
        }
      }
      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    return res.status(408).json({
      status: "error",
      error: "Request timeout",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to generate image",
      details: error.message,
    });
  }
});

module.exports = router;
