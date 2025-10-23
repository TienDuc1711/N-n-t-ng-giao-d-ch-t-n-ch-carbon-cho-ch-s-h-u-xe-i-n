const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CarbonCredit = require('../models/CarbonCredit');
const CreditWallet = require('../models/CreditWallet');

// POST /credits/issue - Issue carbon credits
router.post('/issue', async (req, res) => {
  try {
    const { 
      verificationRequestId, 
      auditRecordId, 
      ownerId, 
      amount, 
      co2Reduced,
      metadata = {}
    } = req.body;
    
    if (!verificationRequestId || !ownerId || !amount || !co2Reduced) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Required fields: verificationRequestId, ownerId, amount, co2Reduced'
        }
      });
    }
    
    // Generate unique credit ID
    const creditId = `CC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Generate certificate hash
    const certificateData = `${creditId}-${ownerId}-${amount}-${co2Reduced}-${Date.now()}`;
    const certificateHash = crypto.createHash('sha256').update(certificateData).digest('hex');
    
    // Create carbon credit
    const carbonCredit = new CarbonCredit({
      id: creditId,
      verificationRequestId,
      auditRecordId: auditRecordId || 'system-audit',
      ownerId,
      amount: parseFloat(amount),
      co2Reduced: parseFloat(co2Reduced),
      certificateHash,
      metadata
    });
    
    await carbonCredit.save();
    
    // Update or create wallet
    let wallet = await CreditWallet.findOne({ ownerId });
    if (!wallet) {
      wallet = new CreditWallet({ ownerId });
    }
    
    // Add credit to wallet
    wallet.credits.push({
      creditId,
      amount: parseFloat(amount),
      issueDate: new Date(),
      status: 'issued'
    });
    
    // Add transaction record
    wallet.transactions.push({
      type: 'issue',
      amount: parseFloat(amount),
      creditId,
      description: `Issued ${amount} credits for verification ${verificationRequestId}`
    });
    
    await wallet.save();
    
    res.status(201).json({
      message: 'Carbon credits issued successfully',
      credit: carbonCredit,
      wallet: {
        ownerId: wallet.ownerId,
        totalCredits: wallet.totalCredits,
        availableCredits: wallet.availableCredits
      }
    });
  } catch (error) {
    console.error('Error issuing credits:', error);
    res.status(500).json({
      error: {
        code: 'ISSUE_ERROR',
        message: 'Failed to issue carbon credits',
        details: error.message
      }
    });
  }
});

// GET /credits/wallet/:ownerId - Get wallet information
router.get('/wallet/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const wallet = await CreditWallet.findOne({ ownerId });
    
    if (!wallet) {
      return res.status(404).json({
        error: {
          code: 'WALLET_NOT_FOUND',
          message: 'Wallet not found for this owner'
        }
      });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch wallet information',
        details: error.message
      }
    });
  }
});

// GET /credits/:creditId - Get specific credit details
router.get('/:creditId', async (req, res) => {
  try {
    const { creditId } = req.params;
    
    const credit = await CarbonCredit.findOne({ id: creditId });
    
    if (!credit) {
      return res.status(404).json({
        error: {
          code: 'CREDIT_NOT_FOUND',
          message: 'Carbon credit not found'
        }
      });
    }
    
    res.json(credit);
  } catch (error) {
    console.error('Error fetching credit:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch credit details',
        details: error.message
      }
    });
  }
});

// GET /credits - Get all credits with filtering
router.get('/', async (req, res) => {
  try {
    const { ownerId, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (ownerId) filter.ownerId = ownerId;
    if (status) filter.status = status;
    
    const credits = await CarbonCredit.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CarbonCredit.countDocuments(filter);
    
    res.json({
      credits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch credits',
        details: error.message
      }
    });
  }
});

// PUT /credits/:creditId/transfer - Transfer credit (placeholder)
router.put('/:creditId/transfer', async (req, res) => {
  try {
    const { creditId } = req.params;
    const { newOwnerId } = req.body;
    
    if (!newOwnerId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_OWNER',
          message: 'New owner ID is required'
        }
      });
    }
    
    // This is a placeholder for credit transfer functionality
    // In a real system, this would involve complex validation and blockchain transactions
    
    res.json({
      message: 'Credit transfer functionality will be implemented in future version',
      creditId,
      newOwnerId
    });
  } catch (error) {
    console.error('Error transferring credit:', error);
    res.status(500).json({
      error: {
        code: 'TRANSFER_ERROR',
        message: 'Failed to transfer credit',
        details: error.message
      }
    });
  }
});

module.exports = router;