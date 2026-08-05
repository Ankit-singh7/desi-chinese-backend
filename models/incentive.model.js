// incentive.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let incentiveSchema = new Schema({

  incentive_id: {
    type: String,
    unique: true,
    index: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  branch_id: {
    type: String,
    default: ''
  },

  amount: {
    type: Number,
    required: true,
    default: 0
  },

  month: {
    type: String, // "YYYY-MM"
    required: true,
    index: true
  },

  reason: {
    type: String,
    default: ''
  },

  added_by: {
    type: String, // admin_id
    default: ''
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }

});

incentiveSchema.index({ employee_id: 1, month: 1 });
incentiveSchema.index({ branch_id: 1, month: 1 });

mongoose.model('incentive', incentiveSchema);