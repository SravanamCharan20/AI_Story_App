const express = require('express');
const router = express.Router();
const {getStoryVoiceCombination}=require('../controllers/storyController')
const auth = require('../middleware/auth');
const {uploadVoiceSample}=require('../controllers/voiceSampleController')
const mult = require('../middleware/mult')

router.get('/getStoryVoiceCombination',auth,getStoryVoiceCombination);

module.exports = router;