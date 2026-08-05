const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let employeePayrollSchema = new Schema({

  payroll_id: {
    type: String,
    unique: true,
    index: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  month: {
    type: String,
    required: true,
    index: true
  },

  branch_id: {
    type: String,
    default: ''
  },

  employee_name: {
    type: String,
    default: ''
  },

  base_salary: {
    type: Number,
    default: 0
  },

  monthly_minutes: {
    type: Number,
    default: 18000
  },

  worked_minutes: {
    type: Number,
    default: 0
  },

  paid_leave_minutes: {
    type: Number,
    default: 0
  },

  festival_minutes: {
    type: Number,
    default: 0
  },

  payable_minutes: {
    type: Number,
    default: 0
  },

  total_late_minutes: {
    type: Number,
    default: 0
  },

  per_minute_rate: {
    type: Number,
    default: 0
  },

  earned_salary: {
    type: Number,
    default: 0
  },

  incentive: {
    type: Number,
    default: 0
  },

  fine: {
    type: Number,
    default: 0
  },

  advance: {
    type: Number,
    default: 0
  },

  late_deduction: {
    type: Number,
    default: 0
  },

  net_salary: {
    type: Number,
    default: 0
  },

  salary_formula: {
    type: String,
    default: ''
  },

  payroll_snapshot: {
    type: Schema.Types.Mixed,
    default: null
  },

  status: {
    type: String,
    enum: [
      'GENERATED',
      'LOCKED',
      'PAID'
    ],
    default: 'GENERATED'
  },

  generated_by: {
    type: String,
    default: ''
  },

  locked_by: {
    type: String,
    default: ''
  },

  paid_by: {
    type: String,
    default: ''
  },

  generated_at: Date,
  locked_at: Date,
  paid_at: Date,

  created_at: {
    type: Date,
    default: Date.now
  },

  updated_at: {
    type: Date,
    default: Date.now
  }

});

employeePayrollSchema.index(
  {
    employee_id: 1,
    month: 1
  },
  {
    unique: true
  }
);

mongoose.model(
  'employee_payroll',
  employeePayrollSchema
);