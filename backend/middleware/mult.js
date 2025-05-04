import multer, { memoryStorage } from "multer";

import path from "path"; 
const storage=memoryStorage()

const fileFilter =(req,file,cb)=>{
    const allowedTypes=["audio/mpeg","audio/wav","audio/ogg",'audio/mp3']
    if (allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }else {
        cb(new Error("Invalid file type"),false)
    }
};

const upload=multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }//5mb limit

})

export default upload
