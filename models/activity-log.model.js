// activity-log.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let activityLogSchema = new Schema({
  log_id:             { type: String, unique: true, index: true },
  operator_id:        { type: String, index: true },   // who did the action
  action_type:        { type: String, index: true },   // PUNCH, FINE, SHIFT, BRANCH, INCENTIVE, ADVANCE, PAYROLL, OVERWRITE
  target_employee_id: { type: String, index: true },   // affected employee
  branch_id:          { type: String, default: null },
  metadata:           { type: Object, default: {} },   // extra details
  created_at:         { type: Date, default: Date.now, index: true }
});

activityLogSchema.index({ target_employee_id: 1, created_at: -1 });
activityLogSchema.index({ operator_id: 1, created_at: -1 });
activityLogSchema.index({ branch_id: 1, created_at: -1 });

mongoose.model('activity_log', activityLogSchema);