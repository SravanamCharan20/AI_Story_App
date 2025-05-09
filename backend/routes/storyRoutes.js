import { Router } from 'express';
const router = Router();
import Story from '../models/Story.js';
import cloudinary from 'cloudinary';
import multer from 'multer';

const storage = multer.memoryStorage(); // You can also use diskStorage if needed
const upload = multer({ storage });

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload files to Cloudinary
const uploadToCloudinary = async (file, folder) => {
  try {
    // Convert buffer to base64
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Data}`;

    const result = await cloudinary.v2.uploader.upload(dataUri, {
      folder: folder,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

// Get a single story by ID
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    res.status(200).json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ message: 'Error fetching story' });
  }
});


router.post('/generate', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'story', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, narrator, language, ageCategory, genre, mood, tags, hasPermission, metadata, userId } = req.body;
    const audioFile = req.files['audio']?.[0];
    const storyFile = req.files['story']?.[0];

    // Upload files to Cloudinary
    const [audioResult, storyResult] = await Promise.all([
      uploadToCloudinary(audioFile, 'stories/audio'),
      uploadToCloudinary(storyFile, 'stories/documents')
    ]);

    // Parse tags and metadata
    let parsedTags = [];
    let parsedMetadata = {};
    try {
      parsedTags = JSON.parse(tags || '[]');
      parsedMetadata = JSON.parse(metadata || '{}');
    } catch (error) {
      console.error('Error parsing tags or metadata:', error);
      parsedTags = [];
      parsedMetadata = {};
    }

    // Create story in database
    const story = new Story({
      title,
      narrator,
      language,
      ageCategory,
      genre,
      mood,
      tags: parsedTags,
      hasPermission: hasPermission === 'true',
      userId,
      audioUrl: audioResult.secure_url,
      storyUrl: storyResult.secure_url,
      metadata: parsedMetadata
    });

    await story.save();

    res.status(200).json({
      message: "Story generated successfully",
      story: {
        id: story._id,
        title: story.title,
        narrator: story.narrator,
        language: story.language,
        ageCategory: story.ageCategory,
        genre: story.genre,
        mood: story.mood,
        tags: story.tags,
        audioUrl: story.audioUrl,
        storyUrl: story.storyUrl,
        metadata: story.metadata,
        createdAt: story.createdAt
      }
    });
  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ 
      message: "Failed to generate story",
      error: error.message 
    });
  }
});


export default router;