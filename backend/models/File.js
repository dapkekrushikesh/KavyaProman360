const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: { type: String },
  filename: { type: String },
  path: { type: String },
  mimetype: { type: String },
  size: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
