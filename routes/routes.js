const express = require('express');
const router = express.Router();
const fal = require('@fal-ai/serverless-client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');

fal.config({
  credentials: process.env.FAL_API_KEY // Changed from FAL_KEY to FAL_API_KEY
});

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, image_size } = req.body;
    console.log('Received request:', { prompt, image_size });
    
    const { request_id } = await fal.queue.submit('fal-ai/flux-pro', {
      input: {
        prompt,
        image_size,
        seed: Math.floor(Math.random() * 1000000),
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: "2",
      },
    });

    console.log('FAL API request submitted, request_id:', request_id);
    res.json({ request_id });
  } catch (error) {
    console.error('Error submitting image generation request:', error);
    res.status(500).json({ error: 'Failed to submit image generation request', details: error.message });
  }
});

router.get('/image-result/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const maxRetries = 30; // Increase max retries
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fal.queue.result('fal-ai/flux-pro', {
        requestId: requestId
      });

      if (result && result.images && result.images.length > 0) {
        const image = result.images[0];
        const fileName = `image_${requestId}.jpg`;
        const filePath = path.join(__dirname, '..', 'public', 'generated', fileName);
        
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(filePath, buffer);
        return res.json({ status: 'success', image_url: `/generated/${fileName}`, original_url: image.url });
      } else {
        // If no image is found, continue to next attempt
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      if (error.status === 400 && error.body && error.body.detail === 'Request is still in progress') {
        if (attempt === maxRetries - 1) {
          return res.status(202).json({ status: 'pending', message: 'Image generation still in progress' });
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Error fetching or saving image result:', error.message);
        return res.status(500).json({ status: 'error', error: 'Failed to fetch or save image result' });
      }
    }
  }

  // If we've exhausted all retries
  return res.status(504).json({ status: 'error', error: 'Image generation timed out' });
});

module.exports = router;