import express, { json } from 'express';
import { connect } from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from 'cloudinary';
import userRoutes from './routes/userRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import { config } from 'dotenv';
import Story from './models/Story.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const app = express();
config();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:8081', 'http://192.168.0.109:8081', 'http://192.168.0.109:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 2 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio and document files
    if (file.fieldname === 'audio') {
      if (!file.mimetype.startsWith('audio/')) {
        return cb(new Error('Only audio files are allowed for audio field'));
      }
    } else if (file.fieldname === 'story') {
      if (!file.mimetype.match(/^(application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        return cb(new Error('Only PDF, TXT, or DOCX files are allowed for story field'));
      }
    }
    cb(null, true);
  }
});

// Middleware
app.use(json());
app.use(cookieParser());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/stories', storyRoutes);

app.post('/api/stories/generate', upload.fields([
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

// Get user's stories
app.get('/api/stories/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// Connect to MongoDB
connect(process.env.MONGO, {
  autoIndex: false,
  // Disable all language-specific features
  collation: undefined
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err);
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    // An unknown error occurred
    console.error('Unknown error:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message
    });
  }
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 