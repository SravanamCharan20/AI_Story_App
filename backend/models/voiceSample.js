// models/VoiceSample.js

const mongoose = require('mongoose');

const voiceSampleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  label: {
    type: String,
    enum: ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Custom'],
    required: true
  },
  customLabel: {
    type: String,
    default: ''
  },
  voiceUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  mimeType: {
    type: String,
    default: 'audio/mpeg'
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VoiceSample', voiceSampleSchema);
