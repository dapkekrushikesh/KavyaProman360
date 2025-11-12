const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const FileModel = require('../models/File');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', uploadDir));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, name);
  }
});
const upload = multer({ storage });

// POST /api/files/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const doc = await FileModel.create({
      originalName: file.originalname,
      filename: file.filename,
      path: `/${uploadDir}/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: req.user._id
    });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload error' });
  }
});

// GET /api/files
router.get('/', auth, async (req, res) => {
  const files = await FileModel.find().populate('uploadedBy', 'email name');
  res.json(files);
});

module.exports = router;
