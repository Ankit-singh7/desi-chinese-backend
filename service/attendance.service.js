const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kolkata');

const Attendance = mongoose.model('attendance');
const Deduction = mongoose.model('deduction');
const User = mongoose.model('User');
const EmployeePayroll = mongoose.model('employee_payroll');

const calculateDeduction = (lateMinutes, rules = []) => {
  let deduction = 0;
  for (let rule of rules) {
    if (lateMinutes >= rule.late_minutes) {
      deduction = rule.deduction;
    }
  }
  return deduction;
};

// ============================================
// 🔥 PUNCH IN / PUNCH OUT
// ============================================

const punch = async (employee_id, branch_id, photoUrl = null) => {

  const now = new Date();
  const attendance_date = moment(now).format('YYYY-MM-DD');

  const employee = await User.findOne(
    { userId: employee_id },
    { shift_time: 1 }
  );

  let record = await Attendance.findOne({
    employee_id,
    attendance_date
  });

  // ==========================================
  // FIRST PUNCH IN
  // ==========================================
  if (!record) {

    let lateMinutes = 0;
    let deductionAmount = 0;

    if (
      employee &&
      employee.shift_time &&
      employee.shift_time.trim() !== ''
    ) {

      const [hours, minutes] = employee.shift_time
        .split(':')
        .map(Number);

      const shiftStart = moment(now)
        .startOf('day')
        .add(hours, 'hours')
        .add(minutes, 'minutes');

      const actualIn = moment(now);

      if (actualIn.isAfter(shiftStart)) {
        lateMinutes = actualIn.diff(
          shiftStart,
          'minutes'
        );
      }

      const deductionConfig = await Deduction.findOne({});

      deductionAmount = calculateDeduction(
        lateMinutes,
        deductionConfig?.rules || []
      );
    }

    record = new Attendance({
      attendance_id: new mongoose.Types.ObjectId().toString(),

      employee_id,
      branch_id,
      attendance_date,
      shift_time: employee?.shift_time || null,

      sessions: [{
        punch_in: now,
        punch_out: null,
        duration: 0,
        punch_in_photo: photoUrl
      }],

      total_hours: 0,

      status:
        lateMinutes > 0
          ? 'LATE'
          : 'PRESENT',

      late_minutes: lateMinutes,
      deduction_amount: deductionAmount,

      is_active: true
    });

    await record.save();

    return {
      type: 'PUNCH_IN',
      message: 'Punch In successful'
    };
  }

  // ==========================================
  // PUNCH OUT
  // ==========================================
  if (record.is_active) {

    const activeSession = record.sessions
      .slice()
      .reverse()
      .find(
        s =>
          s.punch_in &&
          !s.punch_out
      );

    if (activeSession) {

      const duration = Math.floor(
        (
          now -
          new Date(activeSession.punch_in)
        ) /
        (1000 * 60)
      );

      activeSession.punch_out = now;
      activeSession.duration = duration;
      activeSession.punch_out_photo = photoUrl;
    }

    const totalMinutes =
      record.sessions.reduce(
        (sum, session) =>
          sum + (session.duration || 0),
        0
      );

    record.total_hours = totalMinutes;
    record.is_active = false;
    record.updated_at = new Date();

    record.markModified('sessions');

    await record.save();

    return {
      type: 'PUNCH_OUT',
      message: 'Punch Out successful',
      total_hours: totalMinutes
    };
  }

  // ==========================================
  // SUBSEQUENT PUNCH IN
  // ==========================================
  record.sessions.push({
    punch_in: now,
    punch_out: null,
    duration: 0,
    punch_in_photo: photoUrl
  });

  record.is_active = true;
  record.updated_at = new Date();

  record.markModified('sessions');

  await record.save();

  return {
    type: 'PUNCH_IN',
    message: 'Punch In successful'
  };
};

const attachPunchPhoto = async (employee_id, punchType, photoUrl) => {

  const attendance_date = moment().format('YYYY-MM-DD');

  const record = await Attendance.findOne({
    employee_id,
    attendance_date
  });

  if (!record || !record.sessions.length) return;

  const lastSession = record.sessions[record.sessions.length - 1];

  if (punchType === 'PUNCH_IN') {
    lastSession.punch_in_photo = photoUrl;
  } else {
    lastSession.punch_out_photo = photoUrl;
  }

  record.markModified('sessions');
  await record.save();
};

// ============================================
// 🔥 DASHBOARD
// ============================================
const getDashboard = async (employee_id) => {
  const today = moment().format('YYYY-MM-DD');
  const start = moment().startOf('month').format('YYYY-MM-DD');

  const todayAttendance = await Attendance.findOne({
    employee_id,
    attendance_date: today
  });

  const records = await Attendance.find({
    employee_id,
    attendance_date: { $gte: start, $lte: today }
  });

  const recordMap = {};
  records.forEach(r => { recordMap[r.attendance_date] = r; });

  let current = moment(start);
  const todayMoment = moment();

  let totalMinutes = 0;
  let present = 0;
  let absent = 0;

  while (current.isSameOrBefore(todayMoment, 'day')) {
    const dateStr = current.format('YYYY-MM-DD');

    if (recordMap[dateStr]) {
      totalMinutes += recordMap[dateStr].total_hours || 0;
      present++;
    } else {
      if (current.isBefore(todayMoment, 'day')) {
        absent++;
      }
    }

    current.add(1, 'day');
  }

  const sessions = todayAttendance && todayAttendance.sessions
    ? todayAttendance.sessions
    : [];
  const lastSession = sessions[sessions.length - 1] || null;

  return {
    today: todayAttendance ? {
      punch_in: lastSession && lastSession.punch_in ? lastSession.punch_in : null,
      punch_out: lastSession && lastSession.punch_out ? lastSession.punch_out : null,
      total_hours: todayAttendance.total_hours || 0,
      late_minutes: todayAttendance.late_minutes || 0,
      deduction: todayAttendance.deduction_amount || 0,
      status: todayAttendance.is_active ? 'Active' : 'Completed',
      sessions: sessions
    } : null,
    summary: {
      hours: totalMinutes,
      present,
      absent
    }
  };
};

// ============================================
// 🔥 ATTENDANCE LIST
// ============================================
const getAttendanceList = async (employee_id, month, year) => {
  const start = moment(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
  const end = moment(start).endOf('month').format('YYYY-MM-DD');

  const records = await Attendance.find({
    employee_id,
    attendance_date: { $gte: start, $lte: end }
  }).sort({ attendance_date: -1 });

  return records.map((r) => ({
    date: r.attendance_date,
    total_hours: r.total_hours,
    status: r.status,
    late_minutes: r.late_minutes,
    deduction: r.deduction_amount,
    is_active: r.is_active,
    sessions: r.sessions || []
  }));
};


const getBranchesWithLocation = async () => {
  const Branch = mongoose.model('branch');

  const branches = await Branch.find(
    { latitude: { $ne: 0 }, longitude: { $ne: 0 } },
    { branch_id: 1, branch_name: 1, latitude: 1, longitude: 1 }
  );

  return branches;
};

const getEmployeePayrollList = async (employee_id) => {

  const payrolls =
    await EmployeePayroll.find({

      employee_id,

      status: {
        $in: ['GENERATED', 'LOCKED', 'PAID']
      }

    })
      .sort({
        month: -1
      })
      .lean();

  return payrolls.map(item => ({

    payroll_id:
      item.payroll_id,

    month:
      item.month,

    net_salary:
      item.net_salary,

    status:
      item.status,

    worked_minutes:
      item.worked_minutes || 0,

    total_late_minutes:
      item.total_late_minutes || 0,

    incentive:
      item.incentive || 0,

    advance:
      item.advance || 0,

    fine:
      item.fine || 0,

    branch_name:
      item.branch_name || item.payroll_snapshot?.branch_name || '',

    generated_at:
      item.generated_at

  }));

};

const getEmployeeActivity = async (employee_id, limit = 20) => {
  const ActivityLog = mongoose.model('activity_log');
  const Admin = mongoose.model('Admin');

  const logs = await ActivityLog.find({
    target_employee_id: employee_id
  })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();

  const operatorIds = [...new Set(logs.map(l => l.operator_id).filter(Boolean))];

  const [admins, users] = await Promise.all([
    Admin.find(
      { adminId: { $in: operatorIds } },
      { adminId: 1, firstName: 1, lastName: 1 }
    ).lean(),
    User.find(
      { userId: { $in: operatorIds } },
      { userId: 1, firstName: 1, lastName: 1 }
    ).lean()
  ]);

  const operatorMap = {};
  admins.forEach(o => {
    operatorMap[o.adminId] = `${o.firstName} ${o.lastName}`.trim();
  });
  users.forEach(o => {
    operatorMap[o.userId] = `${o.firstName} ${o.lastName}`.trim();
  });

  return logs.map(log => ({
    log_id: log.log_id,
    action_type: log.action_type,
    operator: operatorMap[log.operator_id] || 'System',
    metadata: log.metadata,
    created_at: log.created_at,
    message: formatActivityMessage(log.action_type, log.metadata, operatorMap[log.operator_id], 'employee')
  }));
};

const formatActivityMessage = (actionType, metadata, operatorName, employeeName, viewMode = 'employee') => {
  const op = operatorName || 'Someone';
  const emp = employeeName || 'you';

  switch (actionType) {

    case 'PUNCH_IN':
      return viewMode === 'admin'
        ? `${op} punched in ${emp}`
        : `${op} recorded your punch in`;

    case 'PUNCH_OUT':
      return viewMode === 'admin'
        ? `${op} punched out ${emp}`
        : `${op} recorded your punch out`;

    case 'PUNCH':
      if (metadata?.type === 'PUNCH_IN') {
        return viewMode === 'admin'
          ? `${op} punched in ${emp}`
          : `${op} recorded your punch in`;
      }
      return viewMode === 'admin'
        ? `${op} punched out ${emp}`
        : `${op} recorded your punch out`;

    case 'FINE':
      return viewMode === 'admin'
        ? `${op} added fine of ₹${metadata?.amount} for ${emp} — ${metadata?.reason || ''}`
        : `Fine of ₹${metadata?.amount} added by ${op} — ${metadata?.reason || ''}`;

    case 'INCENTIVE':
      return viewMode === 'admin'
        ? `Incentive of ₹${metadata?.amount} added for ${emp} (${metadata?.month})`
        : `Incentive of ₹${metadata?.amount} added for ${metadata?.month}`;

    case 'ADVANCE':
      return viewMode === 'admin'
        ? `Advance of ₹${metadata?.amount} added for ${emp} (${metadata?.month})`
        : `Advance of ₹${metadata?.amount} added for ${metadata?.month}`;

    case 'SHIFT_CHANGE':
      return viewMode === 'admin'
        ? `${op} changed shift of ${emp} from ${metadata?.old_shift || '?'} → ${metadata?.new_shift || '?'}`
        : `Your shift changed from ${metadata?.old_shift || '?'} → ${metadata?.new_shift || '?'} by ${op}`;

    case 'BRANCH_CHANGE': {
      const oldBranch = metadata?.old_branch || 'previous branch';
      const newBranch = metadata?.new_branch || 'new branch';
      return viewMode === 'admin'
        ? `${op} moved ${emp} from ${oldBranch} → ${newBranch}`
        : `Your branch changed from ${oldBranch} → ${newBranch} by ${op}`;
    }

    case 'SALARY_PAID':
      return `Salary paid for ${metadata?.month}`;

    case 'OVERWRITE':
      return viewMode === 'admin'
        ? `${op} updated attendance of ${emp} for ${metadata?.date}`
        : `Your attendance was updated by ${op} for ${metadata?.date}`;

    case 'ADMIN_PUNCH':
      return viewMode === 'admin'
        ? `${op} recorded attendance of ${emp} for ${metadata?.date}`
        : `Attendance recorded by ${op} for ${metadata?.date}`;

    default:
      return `${op} performed ${actionType} for ${emp}`;
  }
};

module.exports = {
  punch,
  getDashboard,
  getAttendanceList,
  getBranchesWithLocation,
  getEmployeePayrollList,
  getEmployeeActivity,
  attachPunchPhoto
};
