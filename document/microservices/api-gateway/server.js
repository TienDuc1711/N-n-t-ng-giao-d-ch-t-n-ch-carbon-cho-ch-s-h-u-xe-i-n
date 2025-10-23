const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway'
  });
});

// Service URLs from environment variables
const services = {
  verification: process.env.VERIFICATION_SERVICE_URL || 'http://verification-service:3001',
  audit: process.env.AUDIT_SERVICE_URL || 'http://audit-service:3002',
  credit: process.env.CREDIT_SERVICE_URL || 'http://credit-service:3003',
  report: process.env.REPORT_SERVICE_URL || 'http://report-service:3004'
};

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: {
        code: 'PROXY_ERROR',
        message: 'Service temporarily unavailable',
        timestamp: new Date().toISOString()
      }
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add correlation ID for request tracing
    const correlationId = req.headers['x-correlation-id'] || 
                         `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    proxyReq.setHeader('x-correlation-id', correlationId);
    proxyReq.setHeader('x-forwarded-by', 'api-gateway');
  }
};

// Route to Verification Service
app.use('/api/verification', createProxyMiddleware({
  target: services.verification,
  pathRewrite: {
    '^/api/verification': '/verification'
  },
  ...proxyOptions
}));

// Route to Audit Service
app.use('/api/audit', createProxyMiddleware({
  target: services.audit,
  pathRewrite: {
    '^/api/audit': '/audit'
  },
  ...proxyOptions
}));

// Route to Credit Service
app.use('/api/credits', createProxyMiddleware({
  target: services.credit,
  pathRewrite: {
    '^/api/credits': '/credits'
  },
  ...proxyOptions
}));

// Route to Report Service
app.use('/api/reports', createProxyMiddleware({
  target: services.report,
  pathRewrite: {
    '^/api/reports': '/reports'
  },
  ...proxyOptions
}));

// Service health aggregation endpoint
app.get('/api/health/services', async (req, res) => {
  const axios = require('axios');
  const healthChecks = {};
  
  for (const [serviceName, serviceUrl] of Object.entries(services)) {
    try {
      const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
      healthChecks[serviceName] = {
        status: 'healthy',
        response: response.data
      };
    } catch (error) {
      healthChecks[serviceName] = {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  const allHealthy = Object.values(healthChecks).every(check => check.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    gateway: 'healthy',
    services: healthChecks,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service endpoints:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
});