
//we use pino for writing all the logs coz its damn fast
const logger = require('pino')()//npm install pino --save

const moment = require('moment')
const mongoose = require('mongoose');

let captureError = (errorMessage, errorOrigin, errorLevel) => {
  let currentTime = moment()

  let errorResponse = {
    timestamp: currentTime,
    errorMessage: errorMessage,
    errorOrigin: errorOrigin,
    errorLevel: errorLevel
  }

  logger.error(errorResponse)//logger is a method defined in pino so dont search like fool to find where i declared it
  return errorResponse
} // end captureError

let captureInfo = (message, origin, importance) => {
  let currentTime = moment()

  let infoMessage = {
    timestamp: currentTime,
    message: message,
    origin: origin,
    level: importance
  }

  logger.info(infoMessage)
  return infoMessage
} // end infoCapture

// ✅ Add this wrapper in loggerLib.js
const globalActivity = async ({ operator_id, action_type, target_employee_id, branch_id, metadata }) => {
  try {
    const ActivityLog = mongoose.model('activity_log');
    const log = new ActivityLog({
      log_id:             new mongoose.Types.ObjectId().toString(),
      operator_id,
      action_type,
      target_employee_id,
      branch_id:          branch_id || null,
      metadata
    });
    await log.save();
    console.log('✅ Activity logged:', action_type); // ✅ confirm it's saving
  } catch (err) {
    console.error('❌ Activity log failed:', err.message); // ✅ see the actual error
  }
};

module.exports = {
  error: captureError,
  info: captureInfo,
  globalActivity: globalActivity
}
