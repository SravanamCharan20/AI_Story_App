import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  title: String,
  narrator: String,
  language: String,
  ageCategory: String,
  genre: String,
  mood: String,
  tags: [String],
  hasPermission: Boolean,
  userId: mongoose.Schema.Types.ObjectId,
  audioUrl: String,
  storyUrl: String,
  metadata: Object,
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  autoIndex: false,
  collection: 'stories'
});

// Create only necessary indexes
storySchema.index({ userId: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ favorites: 1 });

const Story = mongoose.model('Story', storySchema);

export default Story;
