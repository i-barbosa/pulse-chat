const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('[MongoDB] Conectado com sucesso');
  } catch (error) {
    console.error('[MongoDB Error]', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;