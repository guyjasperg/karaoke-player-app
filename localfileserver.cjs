const express = require('express');
const path = require('path');
const cors = require('cors'); // Import the cors package
const fs = require('fs');

const app = express();
const port = 3001; // Choose a port for the Node.js server

// Allow requests from your Svelte app's origin
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your Svelte app's URL
}));

// Serve video files from the specified directory
const videoDir = '/Users/guyjasper/Documents/Guy/Projects/Python/HelloWorld/NEW_SONGS/';
app.use('/videos', express.static(videoDir));

// API endpoint to list all video files
app.get('/api/videos', (req, res) => {
  fs.readdir(videoDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read directory' });
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4')); // Filter for video files
    res.json({ videos: videoFiles });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Node.js server running at http://localhost:${port}`);
});