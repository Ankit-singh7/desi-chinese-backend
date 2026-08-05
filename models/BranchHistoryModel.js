const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let branchHistorySchema = new Schema({

  history_id: {
    type: String,
    unique: true
  },

  employee_id: {
    type: String,
    required: true,
    index: true
  },

  old_branch_id: {
    type: String
  },

  old_branch_name: {
    type: String
  },

  new_branch_id: {
    type: String,
    required: true
  },

  new_branch_name: {
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
branchHistorySchema.index({ employee_id: 1 });
mongoose.model('branch_history', branchHistorySchema);