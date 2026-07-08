// redis.js
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => {
  console.log('✅ Connexion Redis établie');
});

redis.on('error', (err) => {
  console.error('❌ Erreur Redis:', err.message);
});

export default redis;