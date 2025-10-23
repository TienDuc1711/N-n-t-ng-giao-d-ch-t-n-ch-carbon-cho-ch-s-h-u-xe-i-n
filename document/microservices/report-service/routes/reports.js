const express = require('express');
const router = express.Router();
const axios = require('axios');

const VERIFICATION_SERVICE_URL = process.env.VERIFICATION_SERVICE_URL || 'http://verification-service:3001';
const AUDIT_SERVICE_URL = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3002';
const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://credit-service:3003';

// GET /reports/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Get data from all services
    const [verificationResponse, auditResponse, creditResponse] = await Promise.allSettled([
      axios.get(`${VERIFICATION_SERVICE_URL}/verification/requests`),
      axios.get(`${AUDIT_SERVICE_URL}/audit/records`),
      axios.get(`${CREDIT_SERVICE_URL}/credits`)
    ]);
    
    const verificationData = verificationResponse.status === 'fulfilled' ? verificationResponse.value.data : { requests: [] };
    const auditData = auditResponse.status === 'fulfilled' ? auditResponse.value.data : { auditRecords: [] };
    const creditData = creditResponse.status === 'fulfilled' ? creditResponse.value.data : { credits: [] };
    
    // Filter by date if provided
    let filteredCredits = creditData.credits || [];
    if (fromDate || toDate) {
      filteredCredits = filteredCredits.filter(credit => {
        const issueDate = new Date(credit.issueDate);
        if (fromDate && issueDate < new Date(fromDate)) return false;
        if (toDate && issueDate > new Date(toDate)) return false;
        return true;
      });
    }
    
    // Calculate summary statistics
    const totalCreditsIssued = filteredCredits.reduce((sum, credit) => sum + credit.amount, 0);
    const totalCO2Reduced = filteredCredits.reduce((sum, credit) => sum + credit.co2Reduced, 0);
    const totalTransactions = filteredCredits.length;
    const totalVerificationRequests = verificationData.requests?.length || 0;
    const totalAuditRecords = auditData.auditRecords?.length || 0;
    
    // Status breakdown
    const statusBreakdown = {};
    (verificationData.requests || []).forEach(request => {
      statusBreakdown[request.status] = (statusBreakdown[request.status] || 0) + 1;
    });
    
    res.json({
      summary: {
        totalCreditsIssued: Math.round(totalCreditsIssued * 100) / 100,
        totalCO2Reduced: Math.round(totalCO2Reduced * 100) / 100,
        totalTransactions,
        totalVerificationRequests,
        totalAuditRecords
      },
      statusBreakdown,
      dateRange: {
        from: fromDate || null,
        to: toDate || null
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      error: {
        code: 'SUMMARY_ERROR',
        message: 'Failed to generate summary report',
        details: error.message
      }
    });
  }
});

// POST /reports/generate - Generate detailed report
router.post('/generate', async (req, res) => {
  try {
    const { 
      reportType = 'credit_issuance',
      fromDate,
      toDate,
      includeDetails = true
    } = req.body;
    
    let reportData = {};
    
    switch (reportType) {
      case 'credit_issuance':
        reportData = await generateCreditIssuanceReport(fromDate, toDate, includeDetails);
        break;
      case 'verification_audit':
        reportData = await generateVerificationAuditReport(fromDate, toDate, includeDetails);
        break;
      case 'co2_impact':
        reportData = await generateCO2ImpactReport(fromDate, toDate, includeDetails);
        break;
      default:
        return res.status(400).json({
          error: {
            code: 'INVALID_REPORT_TYPE',
            message: 'Invalid report type. Supported types: credit_issuance, verification_audit, co2_impact'
          }
        });
    }
    
    res.json({
      reportType,
      dateRange: { from: fromDate, to: toDate },
      generatedAt: new Date().toISOString(),
      ...reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: {
        code: 'REPORT_ERROR',
        message: 'Failed to generate report',
        details: error.message
      }
    });
  }
});

// GET /reports/export/:format - Export report in specified format
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { reportType = 'credit_issuance', fromDate, toDate } = req.query;
    
    if (!['json', 'csv', 'excel'].includes(format)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FORMAT',
          message: 'Supported formats: json, csv, excel'
        }
      });
    }
    
    // For now, return JSON format with export information
    // In a real implementation, this would generate actual CSV/Excel files
    const reportData = await generateCreditIssuanceReport(fromDate, toDate, true);
    
    res.json({
      message: `Export functionality for ${format} format will be implemented in future version`,
      reportType,
      format,
      dateRange: { from: fromDate, to: toDate },
      dataPreview: reportData
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export report',
        details: error.message
      }
    });
  }
});

// GET /reports/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get credits data for analytics
    const creditResponse = await axios.get(`${CREDIT_SERVICE_URL}/credits`);
    const credits = creditResponse.data.credits || [];
    
    // Calculate period start date
    const now = new Date();
    const periodDays = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    // Filter credits by period
    const periodCredits = credits.filter(credit => 
      new Date(credit.issueDate) >= startDate
    );
    
    // Generate analytics
    const analytics = {
      period: `${periodDays} days`,
      totalCredits: periodCredits.reduce((sum, credit) => sum + credit.amount, 0),
      totalCO2: periodCredits.reduce((sum, credit) => sum + credit.co2Reduced, 0),
      averageCreditsPerDay: periodCredits.length > 0 ? 
        (periodCredits.reduce((sum, credit) => sum + credit.amount, 0) / periodDays).toFixed(2) : 0,
      creditsIssuedCount: periodCredits.length,
      topOwners: getTopOwners(periodCredits, 5),
      dailyTrends: getDailyTrends(periodCredits, periodDays)
    };
    
    res.json({
      analytics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to generate analytics',
        details: error.message
      }
    });
  }
});

// Helper functions
async function generateCreditIssuanceReport(fromDate, toDate, includeDetails) {
  const creditResponse = await axios.get(`${CREDIT_SERVICE_URL}/credits`);
  let credits = creditResponse.data.credits || [];
  
  // Filter by date
  if (fromDate || toDate) {
    credits = credits.filter(credit => {
      const issueDate = new Date(credit.issueDate);
      if (fromDate && issueDate < new Date(fromDate)) return false;
      if (toDate && issueDate > new Date(toDate)) return false;
      return true;
    });
  }
  
  const summary = {
    totalCredits: credits.reduce((sum, credit) => sum + credit.amount, 0),
    totalCO2Reduced: credits.reduce((sum, credit) => sum + credit.co2Reduced, 0),
    totalIssuances: credits.length,
    averageCreditsPerIssuance: credits.length > 0 ? 
      (credits.reduce((sum, credit) => sum + credit.amount, 0) / credits.length).toFixed(2) : 0
  };
  
  return {
    summary,
    details: includeDetails ? credits : null,
    count: credits.length
  };
}

async function generateVerificationAuditReport(fromDate, toDate, includeDetails) {
  const [verificationResponse, auditResponse] = await Promise.all([
    axios.get(`${VERIFICATION_SERVICE_URL}/verification/requests`),
    axios.get(`${AUDIT_SERVICE_URL}/audit/records`)
  ]);
  
  const verifications = verificationResponse.data.requests || [];
  const audits = auditResponse.data.auditRecords || [];
  
  return {
    summary: {
      totalVerifications: verifications.length,
      totalAudits: audits.length,
      approvedCount: audits.filter(audit => audit.decision === 'approved').length,
      rejectedCount: audits.filter(audit => audit.decision === 'rejected').length
    },
    details: includeDetails ? { verifications, audits } : null
  };
}

async function generateCO2ImpactReport(fromDate, toDate, includeDetails) {
  const creditResponse = await axios.get(`${CREDIT_SERVICE_URL}/credits`);
  let credits = creditResponse.data.credits || [];
  
  // Filter by date
  if (fromDate || toDate) {
    credits = credits.filter(credit => {
      const issueDate = new Date(credit.issueDate);
      if (fromDate && issueDate < new Date(fromDate)) return false;
      if (toDate && issueDate > new Date(toDate)) return false;
      return true;
    });
  }
  
  const totalCO2Reduced = credits.reduce((sum, credit) => sum + credit.co2Reduced, 0);
  const averageCO2PerCredit = credits.length > 0 ? 
    (totalCO2Reduced / credits.length).toFixed(2) : 0;
  
  return {
    summary: {
      totalCO2Reduced,
      averageCO2PerCredit,
      equivalentTrees: Math.round(totalCO2Reduced / 22), // 1 tree absorbs ~22kg CO2/year
      equivalentCars: Math.round(totalCO2Reduced / 4600) // Average car emits ~4.6 tons CO2/year
    },
    details: includeDetails ? credits : null
  };
}

function getTopOwners(credits, limit) {
  const ownerStats = {};
  credits.forEach(credit => {
    if (!ownerStats[credit.ownerId]) {
      ownerStats[credit.ownerId] = { credits: 0, co2: 0 };
    }
    ownerStats[credit.ownerId].credits += credit.amount;
    ownerStats[credit.ownerId].co2 += credit.co2Reduced;
  });
  
  return Object.entries(ownerStats)
    .sort(([,a], [,b]) => b.credits - a.credits)
    .slice(0, limit)
    .map(([ownerId, stats]) => ({ ownerId, ...stats }));
}

function getDailyTrends(credits, days) {
  const trends = {};
  const now = new Date();
  
  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dateKey = date.toISOString().split('T')[0];
    trends[dateKey] = { credits: 0, co2: 0, count: 0 };
  }
  
  // Aggregate credits by day
  credits.forEach(credit => {
    const dateKey = credit.issueDate.split('T')[0];
    if (trends[dateKey]) {
      trends[dateKey].credits += credit.amount;
      trends[dateKey].co2 += credit.co2Reduced;
      trends[dateKey].count += 1;
    }
  });
  
  return trends;
}

module.exports = router;