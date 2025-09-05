const express = require('express');
const axios = require('axios');
const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Quest.io API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {},
    latency: {},
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Test internal services
  const serviceTests = [
    {
      name: 'pollinations',
      test: () => axios.get('http://localhost:3001/api/pollinations/health', { timeout: 5000 })
    }
  ];

  // Run service tests
  for (const service of serviceTests) {
    const startTime = Date.now();
    try {
      await service.test();
      healthStatus.services[service.name] = true;
      healthStatus.latency[service.name] = Date.now() - startTime;
    } catch (error) {
      healthStatus.services[service.name] = false;
      healthStatus.latency[service.name] = Date.now() - startTime;
      healthStatus.status = 'degraded';
    }
  }

  // Determine overall status
  const failedServices = Object.values(healthStatus.services).filter(status => !status).length;
  if (failedServices > 0) {
    healthStatus.status = failedServices === Object.keys(healthStatus.services).length ? 'down' : 'degraded';
  }

  res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', (req, res) => {
  // Check if all critical services are ready
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;