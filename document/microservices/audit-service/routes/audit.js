const express = require('express');
const router = express.Router();
const axios = require('axios');
const AuditRecord = require('../models/AuditRecord');

const VERIFICATION_SERVICE_URL = process.env.VERIFICATION_SERVICE_URL || 'http://verification-service:3001';
const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://credit-service:3003';

// GET /audit/pending - Get pending audit requests
router.get('/pending', async (req, res) => {
  try {
    // Get verified requests from verification service
    const verificationResponse = await axios.get(`${VERIFICATION_SERVICE_URL}/verification/requests?status=verified`);
    const verifiedRequests = verificationResponse.data.requests || [];
    
    res.json({
      pendingApprovals: verifiedRequests,
      count: verifiedRequests.length
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch pending approvals',
        details: error.message
      }
    });
  }
});

// POST /audit/approve/:id - Approve verification request
router.post('/approve/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { notes = 'Approved by audit service' } = req.body;
    
    // Get request details from verification service
    const verificationResponse = await axios.get(`${VERIFICATION_SERVICE_URL}/verification/requests/${requestId}`);
    const request = verificationResponse.data;
    
    if (!request) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found'
        }
      });
    }
    
    if (request.status !== 'verified') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Request must be verified before approval'
        }
      });
    }
    
    // Create audit record
    const auditId = `AUD${Date.now()}`;
    const auditRecord = new AuditRecord({
      id: auditId,
      verificationRequestId: requestId,
      action: 'approve',
      notes,
      decision: 'approved',
      metadata: {
        previousStatus: request.status,
        newStatus: 'approved',
        co2Reduction: request.co2Calculation?.totalReduction || 0,
        creditsToIssue: Math.round((request.co2Calculation?.totalReduction || 0) / 10 * 100) / 100
      }
    });
    
    await auditRecord.save();
    
    // Call credit service to issue credits
    try {
      await axios.post(`${CREDIT_SERVICE_URL}/credits/issue`, {
        verificationRequestId: requestId,
        ownerId: request.evOwner,
        amount: auditRecord.metadata.creditsToIssue,
        co2Reduced: auditRecord.metadata.co2Reduction,
        auditRecordId: auditId
      });
    } catch (creditError) {
      console.error('Error issuing credits:', creditError);
      // Continue with approval even if credit issuance fails
    }
    
    res.json({
      message: 'Request approved successfully',
      auditRecord,
      creditsIssued: auditRecord.metadata.creditsToIssue
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      error: {
        code: 'APPROVAL_ERROR',
        message: 'Failed to approve request',
        details: error.message
      }
    });
  }
});

// POST /audit/reject/:id - Reject verification request
router.post('/reject/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { reason = 'Rejected by audit service', notes = '' } = req.body;
    
    // Get request details from verification service
    const verificationResponse = await axios.get(`${VERIFICATION_SERVICE_URL}/verification/requests/${requestId}`);
    const request = verificationResponse.data;
    
    if (!request) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found'
        }
      });
    }
    
    // Update verification service status
    await axios.put(`${VERIFICATION_SERVICE_URL}/verification/requests/${requestId}/status`, {
      status: 'rejected',
      verificationNotes: `Rejected: ${reason}`
    });
    
    // Create audit record
    const auditId = `AUD${Date.now()}`;
    const auditRecord = new AuditRecord({
      id: auditId,
      verificationRequestId: requestId,
      action: 'reject',
      notes: notes || reason,
      decision: 'rejected',
      metadata: {
        previousStatus: request.status,
        newStatus: 'rejected',
        reason
      }
    });
    
    await auditRecord.save();
    
    res.json({
      message: 'Request rejected successfully',
      auditRecord,
      reason
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      error: {
        code: 'REJECTION_ERROR',
        message: 'Failed to reject request',
        details: error.message
      }
    });
  }
});

// GET /audit/history/:id - Get audit history for a request
router.get('/history/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    
    const auditHistory = await AuditRecord.find({ verificationRequestId: requestId })
      .sort({ createdAt: -1 });
    
    res.json({
      requestId,
      auditHistory,
      count: auditHistory.length
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch audit history',
        details: error.message
      }
    });
  }
});

// GET /audit/records - Get all audit records
router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 10, action, decision } = req.query;
    
    const filter = {};
    if (action) filter.action = action;
    if (decision) filter.decision = decision;
    
    const auditRecords = await AuditRecord.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AuditRecord.countDocuments(filter);
    
    res.json({
      auditRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit records:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch audit records',
        details: error.message
      }
    });
  }
});

module.exports = router;