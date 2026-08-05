const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let fineSchema = new Schema({

  fine_id: {
    type: String,
    unique: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  operator_id: {
    type: String,
    default: null
  },

  branch_id: {
    type: String,
    default: null,
    index: true
  },

  amount: {
    type: Number,
    required: true
  },

  reason: {
    type: String,
    default: ''
  },

  applied_on: {
    type: Date,
    default: Date.now
  },

  apply_to: {
    type: String,
    enum: ['CURRENT', 'NEXT'],
    default: 'CURRENT'
  },

  // 🔥 For salary integration
  salary_processed: {
    type: Boolean,
    default: false
  },

  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }

});

fineSchema.index({ employee_id: 1, created_at: 1 });
fineSchema.index({ branch_id: 1, created_at: 1 });

mongoose.model('fine', fineSchema);