const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let operatorActivitySchema = new Schema({
  activity_id: {
    type: String,
    unique: true
  },

  operator_id: {
    type: String,
    required: true,
    index: true
  },

  branch_id: {
    type: String
  },

  action_type: {
    type: String,
    required: true
    // PUNCH, FINE, SHIFT_CHANGE, BRANCH_CHANGE
  },

  target_employee_id: {
    type: String,
    default: null
  },

  metadata: {
    type: Object,
    default: {}
  },

  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

mongoose.model('operator_activity', operatorActivitySchema);