const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// HOOK CORRIGIDO: Sem callback 'next' ao usar async/await
channelSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Channel', channelSchema);