const mongoose = require('mongoose');

const creditWalletSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    unique: true
  },
  totalCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  credits: [{
    creditId: String,
    amount: Number,
    issueDate: Date,
    status: String
  }],
  transactions: [{
    type: {
      type: String,
      enum: ['issue', 'transfer_in', 'transfer_out', 'retire']
    },
    amount: Number,
    creditId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
}, {
  timestamps: true
});

// Update totals before saving
creditWalletSchema.pre('save', function(next) {
  this.totalCredits = this.credits.reduce((sum, credit) => sum + credit.amount, 0);
  this.availableCredits = this.credits
    .filter(credit => credit.status === 'issued')
    .reduce((sum, credit) => sum + credit.amount, 0);
  next();
});

module.exports = mongoose.model('CreditWallet', creditWalletSchema);