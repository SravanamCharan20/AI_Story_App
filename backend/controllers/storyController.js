const Story = require('../models/storyModel');
const VoiceSample = require('../models/voiceSample');

const getStoryVoiceCombination = async (req, res) => {
  try {
    const { storyId, voiceId } = req.query;

    if (!storyId || !voiceId) {
      return res.status(400).json({ message: "Story ID and Voice ID are required" });
    }

    // Fetch the story and voiceSample documents from the DB
    const story = await Story.findById(storyId);
    const voice = await VoiceSample.findById(voiceId);

    if (!story || !voice) {
      return res.status(404).json({ message: "Story or voice not found" });
    }

    // Construct the voice name
    const voiceName = voice.label === 'Custom' ? voice.customLabel : voice.label;

    // Construct audio URL (assuming audio is named using storyId and voiceId)
    const audioFileName = `${storyId}_${voiceId}.mp3`;
    const audioURL = `https://your-firebase-storage/${audioFileName}`;

    res.status(200).json({
      storyTitle: story.title,
      voiceName: voiceName,
      audioURL: audioURL
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStoryVoiceCombination };
