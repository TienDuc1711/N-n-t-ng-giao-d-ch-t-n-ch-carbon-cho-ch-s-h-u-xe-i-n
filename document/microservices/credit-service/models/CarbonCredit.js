const mongoose = require('mongoose');

const carbonCreditSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  verificationRequestId: {
    type: String,
    required: true
  },
  auditRecordId: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  co2Reduced: {
    type: Number,
    required: true,
    min: 0
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['issued', 'transferred', 'retired'],
    default: 'issued'
  },
  certificateHash: {
    type: String,
    required: true
  },
  metadata: {
    evModel: String,
    licensePlate: String,
    tripPeriod: {
      start: Date,
      end: Date
    },
    emissionFactor: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);