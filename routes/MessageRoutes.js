import { Router } from "express";
import multer from "multer"
import { Getmessage, addAudioMessage, addImageMessage, addMessage, getInitialContacts } from "../controllers/MessageController.js";

const router = Router();
const uploadAudio = multer({dest:"uploads/recordings"})
const uploadImage = multer({dest:"uploads/images"});

router.post("/add-message",addMessage);
router.get("/get-messages/:from/:to",Getmessage);
router.post("/add-image-message/:from/:to",uploadImage.single("image"),addImageMessage);
router.post("/add-audio-message/:from/:to",uploadAudio.single("audio"),addAudioMessage);
router.get("/get-initial-contacts/:from",getInitialContacts);

export default router;    