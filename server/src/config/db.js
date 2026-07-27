require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL nao encontrada no arquivo .env');
    }

    await mongoose.connect(dbUrl);
    console.log('[MongoDB] Conectado com sucesso');
  } catch (error) {
    console.error('[MongoDB Error]', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;