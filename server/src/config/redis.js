const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('[Upstash Redis] Conectado com sucesso');
});

redis.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

module.exports = redis;