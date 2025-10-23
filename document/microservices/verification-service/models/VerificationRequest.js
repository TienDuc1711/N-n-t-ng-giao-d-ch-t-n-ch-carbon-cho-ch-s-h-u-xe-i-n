const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  evOwner: {
    type: String,
    required: true
  },
  evModel: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true
  },
  tripData: {
    totalKm: {
      type: Number,
      required: true,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    routes: [{
      distance: Number,
      date: Date,
      startLocation: String,
      endLocation: String
    }]
  },
  co2Calculation: {
    totalReduction: {
      type: Number,
      required: true,
      min: 0
    },
    emissionFactor: {
      type: Number,
      default: 0.15 // kg CO2 per km
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in-review', 'verified', 'rejected'],
    default: 'pending'
  },
  documents: [{
    type: String
  }],
  verificationNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save hook - CO2 calculation is handled by CO2Calculator service
verificationRequestSchema.pre('save', function(next) {
  // CO2 calculation is handled in the route using CO2Calculator
  // This ensures consistency and avoids double calculation
  next();
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);