const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let deductionSchema = new Schema({
  rules: [
    {
      late_minutes: Number,
      deduction: Number
    }
  ]
});

mongoose.model('deduction', deductionSchema);