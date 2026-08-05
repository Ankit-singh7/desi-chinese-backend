// payroll.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payrollEmployeeSchema = new Schema({
  employee_id:    { type: String },
  employee_name:  { type: String },
  branch_id:      { type: String },
  branch_name:    { type: String },
  base_salary:    { type: Number, default: 0 },
  incentive:      { type: Number, default: 0 },
  fine:           { type: Number, default: 0 },
  late_deduction: { type: Number, default: 0 },
  advance:        { type: Number, default: 0 },
  net_salary:     { type: Number, default: 0 },
  working_days:   { type: Number, default: 0 },
  present_days:   { type: Number, default: 0 },
  absent_days:    { type: Number, default: 0 },
}, { _id: false });

let payrollSchema = new Schema({
  payroll_id: { type: String, unique: true, index: true },
  month:      { type: String, required: true, index: true }, // "YYYY-MM"
  branch_id:  { type: String, default: '', index: true },    // '' = all branches
  status: {
    type: String,
    enum: ['DRAFT', 'GENERATED', 'LOCKED', 'PAID'],
    default: 'DRAFT'
  },
  employees:    { type: [payrollEmployeeSchema], default: [] },
  generated_by: { type: String, default: null },
  locked_by:    { type: String, default: null },
  paid_by:      { type: String, default: null },
  generated_at: { type: Date, default: null },
  locked_at:    { type: Date, default: null },
  paid_at:      { type: Date, default: null },
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now },
  per_day_salary:   { type: Number, default: 0 },
  earned_salary:    { type: Number, default: 0 },
  absent_deduction: { type: Number, default: 0 },
});

payrollSchema.index({ month: 1, branch_id: 1 }, { unique: true });
mongoose.model('payroll', payrollSchema);