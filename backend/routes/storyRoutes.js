import { Router } from 'express';
const router = Router();
import { getStoryVoiceCombination } from '../controllers/storyController.js';
import auth from '../middleware/auth.js';;

router.get('/getStoryVoiceCombination',auth,getStoryVoiceCombination);

export default router;