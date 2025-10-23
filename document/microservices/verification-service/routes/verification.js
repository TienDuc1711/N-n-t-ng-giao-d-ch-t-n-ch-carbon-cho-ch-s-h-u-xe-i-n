const express = require('express');
const router = express.Router();
const Joi = require('joi');
const VerificationRequest = require('../models/VerificationRequest');
const co2Calculator = require('../services/co2Calculator');

// Joi validation schemas
const createRequestSchema = Joi.object({
  evOwner: Joi.string().min(2).max(100).required(),
  evModel: Joi.string().min(2).max(100).required(),
  licensePlate: Joi.string().min(5).max(20).required(),
  tripData: Joi.object({
    totalKm: Joi.number().positive().max(10000).required(),
    startDate: Joi.date().max('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).max('now').required(),
    routes: Joi.array().items(Joi.object({
      distance: Joi.number().positive(),
      date: Joi.date(),
      startLocation: Joi.string(),
      endLocation: Joi.string()
    })).optional()
  }).required(),
  documents: Joi.array().items(Joi.string()).optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-review', 'verified', 'rejected').required(),
  verificationNotes: Joi.string().max(1000).optional()
});

// GET /verification/requests - Get all verification requests
router.get('/requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};
    
    const requests = await VerificationRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await VerificationRequest.countDocuments(filter);
    
    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch verification requests',
        details: error.message
      }
    });
  }
});

// GET /verification/requests/:id - Get specific verification request
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await VerificationRequest.findOne({ id: req.params.id });
    
    if (!request) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found'
        }
      });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching verification request:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch verification request',
        details: error.message
      }
    });
  }
});

// POST /verification/requests - Create new verification request
router.post('/requests', async (req, res) => {
  try {
    // Joi validation
    const { error, value } = createRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.details.map(detail => detail.message)
        }
      });
    }
    
    const { evOwner, evModel, licensePlate, tripData, documents } = value;
    
    // Additional trip data validation using CO2Calculator
    const validation = co2Calculator.validateTripData(tripData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          code: 'TRIP_DATA_ERROR',
          message: 'Invalid trip data',
          details: validation.errors
        }
      });
    }
    
    // Calculate CO2 reduction
    const co2Calculation = co2Calculator.calculateCO2Reduction(tripData.totalKm);
    
    // Generate unique ID
    const id = `REQ${Date.now()}`;
    
    const verificationRequest = new VerificationRequest({
      id,
      evOwner,
      evModel,
      licensePlate,
      tripData,
      co2Calculation,
      documents: documents || [],
      status: 'pending'
    });
    
    await verificationRequest.save();
    
    res.status(201).json({
      message: 'Verification request created successfully',
      request: verificationRequest
    });
  } catch (error) {
    console.error('Error creating verification request:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create verification request',
        details: error.message
      }
    });
  }
});

// PUT /verification/requests/:id/status - Update verification status
router.put('/requests/:id/status', async (req, res) => {
  try {
    // Joi validation
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status update data',
          details: error.details.map(detail => detail.message)
        }
      });
    }
    
    const { status, verificationNotes } = value;
    
    const request = await VerificationRequest.findOneAndUpdate(
      { id: req.params.id },
      { 
        status, 
        verificationNotes: verificationNotes || '',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Verification request not found'
        }
      });
    }
    
    res.json({
      message: 'Verification status updated successfully',
      request
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update verification status',
        details: error.message
      }
    });
  }
});

// GET /verification/calculate-co2 - Calculate CO2 reduction
router.get('/calculate-co2', (req, res) => {
  try {
    const { totalKm, vehicleType = 'gasoline' } = req.query;
    
    if (!totalKm || totalKm <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Total kilometers must be greater than 0'
        }
      });
    }
    
    const calculation = co2Calculator.calculateCO2Reduction(parseFloat(totalKm), vehicleType);
    const carbonCredits = co2Calculator.calculateCarbonCredits(calculation.totalReduction);
    
    res.json({
      ...calculation,
      carbonCredits
    });
  } catch (error) {
    console.error('Error calculating CO2:', error);
    res.status(500).json({
      error: {
        code: 'CALCULATION_ERROR',
        message: 'Failed to calculate CO2 reduction',
        details: error.message
      }
    });
  }
});

module.exports = router;