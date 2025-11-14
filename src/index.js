const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./logger');
const openapi = require('../openapi.json');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const redis = new Redis(process.env.REDIS_URL);

app.get('/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const pong = await redis.ping();
    res.json({ status: 'ok', db: true, redis: pong === 'PONG' });
  } catch (err) {
    logger.error('Health check failed', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Simple register endpoint (create user)
app.post('/api/register', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const result = await pool.query(
      'INSERT INTO users(email, name) VALUES($1, $2) RETURNING id, email, name, created_at',
      [email, name || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Register error', err);
    res.status(500).json({ error: err.message });
  }
});

// Collect event
app.post('/api/collect', async (req, res) => {
  const { apiKey, type, payload } = req.body;
  if (!apiKey || !type) return res.status(400).json({ error: 'apiKey and type required' });
  try {
    const appRow = await pool.query('SELECT id FROM apps WHERE api_key = $1', [apiKey]);
    if (appRow.rowCount === 0) return res.status(404).json({ error: 'app not found' });
    const appId = appRow.rows[0].id;
    await pool.query('INSERT INTO events(app_id, type, payload) VALUES($1, $2, $3)', [appId, type, payload || null]);
    // quick increment in redis
    await redis.incr(`app:${appId}:events`);
    res.status(201).json({ status: 'ok' });
  } catch (err) {
    logger.error('Collect error', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple stats
app.get('/api/apps/:id/stats', async (req, res) => {
  const appId = req.params.id;
  try {
    const eventsRes = await pool.query('SELECT COUNT(*)::int AS total FROM events WHERE app_id = $1', [appId]);
    const redisCount = await redis.get(`app:${appId}:events`);
    res.json({ total_events: eventsRes.rows[0].total, redis_count: parseInt(redisCount || '0', 10) });
  } catch (err) {
    logger.error('Stats error', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
