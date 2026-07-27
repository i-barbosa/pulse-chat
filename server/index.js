const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Conecta ao MongoDB antes de subir o servidor
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[Server] Rodando na porta ${PORT}`);
});