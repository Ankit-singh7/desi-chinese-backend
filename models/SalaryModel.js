const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let salarySchema = new Schema({
  salary_id: String,
  employee_id: String,
  month: Number,
  year: Number,

  total_salary: Number,
  total_deduction: Number,
  total_fine: Number,
  net_salary: Number,

  status: {
    type: String,
    default: 'PENDING' // PAID / PENDING
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('salary', salarySchema);