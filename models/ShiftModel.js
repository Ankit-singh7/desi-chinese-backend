const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let shiftHistorySchema = new Schema({

  history_id: {
    type: String,
    unique: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  old_shift: {
    type: String
  },

  new_shift: {
    type: String,
    required: true
  },

  changed_by: {
    type: String, // OPERATOR / ADMIN
    required: true
  },

  operator_id: {
    type: String
  },

  created_at: {
    type: Date,
    default: Date.now
  }

});

mongoose.model('shift_history', shiftHistorySchema);