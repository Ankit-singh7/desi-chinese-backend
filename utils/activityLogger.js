const mongoose = require('mongoose');
const OperatorActivity = mongoose.model('operator_activity');

const logActivity = async ({
  operator_id,
  branch_id,
  action_type,
  target_employee_id,
  metadata = {}
}) => {

  try {
    await OperatorActivity.create({
      activity_id: new mongoose.Types.ObjectId().toString(),
      operator_id,
      branch_id,
      action_type,
      target_employee_id,
      metadata
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
    // ❗ Never break main flow
  }

};

module.exports = { logActivity };