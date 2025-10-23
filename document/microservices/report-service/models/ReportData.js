const mongoose = require('mongoose');

const reportDataSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  reportType: {
    type: String,
    enum: ['credit_issuance', 'verification_audit', 'co2_impact', 'summary'],
    required: true
  },
  dateRange: {
    from: Date,
    to: Date
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedBy: {
    type: String,
    default: 'system'
  },
  metadata: {
    totalRecords: Number,
    filters: Object,
    exportFormat: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportData', reportDataSchema);