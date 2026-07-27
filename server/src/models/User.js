const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { 
    type: String, 
    default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' 
  },
  status: { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);