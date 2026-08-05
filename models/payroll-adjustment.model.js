const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let payrollAdjustmentSchema = new Schema({

  adjustment_id: {
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

  month: {
    type: String, // YYYY-MM
    required: true,
    index: true
  },

  paid_leave_days: {
    type: Number,
    default: 4
  },

  festival_days: {
    type: Number,
    default: 0
  },

  updated_by: {
    type: String,
    default: ''
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }

});

payrollAdjustmentSchema.index(
  {
    employee_id: 1,
    month: 1
  },
  {
    unique: true
  }
);

mongoose.model(
  'payroll_adjustment',
  payrollAdjustmentSchema
);