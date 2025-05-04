import voiceSample from '../models/voiceSample.js';
import fs from 'fs';
import path from 'path';

export async function uploadVoiceSample(req, res){
    try{
        const userId=req.user._id;
        const file=req.file;
        const {label,customLabel}=req.body;
        if (!file) {
            return res.status(400).json({message:"No file uploaded"});
        }
        const url =await this.uploadVoiceSample(file.buffer, file.originalname,file.mimetype);
        const voiceSampleData = new voiceSample({
            userId,
            label,
            customLabel: label === 'Custom' ? customLabel : '',
            voiceUrl: url,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype
        });
        await voiceSampleData.save();
        res.status(201).json({ message: 'Voice uploaded', data: voiceSample });


    }catch(err){
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}