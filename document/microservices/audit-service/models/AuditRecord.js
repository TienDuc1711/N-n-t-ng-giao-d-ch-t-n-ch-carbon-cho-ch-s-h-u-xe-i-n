const mongoose = require('mongoose');

const auditRecordSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  verificationRequestId: {
    type: String,
    required: true
  },
  auditorId: {
    type: String,
    default: 'system-auditor'
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'review', 'start_verification'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'pending'],
    default: 'pending'
  },
  metadata: {
    previousStatus: String,
    newStatus: String,
    reason: String,
    co2Reduction: Number,
    creditsToIssue: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditRecord', auditRecordSchema);