const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kolkata');
const { logActivity } = require('../utils/activityLogger');
const { globalActivity } = require('../libs/loggerLib');
const { buildActiveEmployeeFilter } = require('../utils/shiftlyFilters');

const User = mongoose.model('User');
const Admin = mongoose.model('Admin');
const Attendance = mongoose.model('attendance');
const ShiftHistory = mongoose.model('shift_history');
const Branch = mongoose.model('branch');
const BranchHistory = mongoose.model('branch_history');
const Fine = mongoose.model('employee_fine');
const OperatorActivity = mongoose.model('operator_activity');
const Deduction = mongoose.model('deduction');
const Advance = mongoose.model('advance');

const calculateDeduction = (lateMinutes, rules = []) => {
  let deduction = 0;
  for (let rule of rules) {
    if (lateMinutes >= rule.late_minutes) {
      deduction = rule.deduction;
    }
  }
  return deduction;
};

/** Resolve employee or operator (User / Admin) for Shiftly staff actions */
const findStaffById = async (personId, projection = null) => {
  const userQuery = User.findOne({ userId: personId }, projection);
  const user = await userQuery;
  if (user) {
    return { doc: user, collection: 'User', idField: 'userId' };
  }

  const adminQuery = Admin.findOne({ adminId: personId }, projection);
  const admin = await adminQuery;
  if (admin) {
    return { doc: admin, collection: 'Admin', idField: 'adminId' };
  }

  return null;
};

const getOperatorDashboard = async (operatorId) => {

  const operator = await Admin.findOne(
    { adminId: operatorId },
    { role: 1 }
  );

  if (!operator) {
    throw new Error('Operator not found');
  }

  const employees = await User.find(
    buildActiveEmployeeFilter(),
    { userId: 1 }
  );

  const employeeIds = employees.map(e => e.userId);
  const totalEmployees = employeeIds.length;

  const today = moment().format('YYYY-MM-DD');

  const attendance = await Attendance.find(
    {
      employee_id: { $in: employeeIds },
      attendance_date: today
    },
    {
      employee_id: 1,
      is_active: 1
    }
  );

  const presentToday = attendance.length;

  const pendingPunchOut = attendance.reduce((count, record) => {
    return record.is_active ? count + 1 : count;
  }, 0);

  const monthStart = moment()
    .startOf('month')
    .format('YYYY-MM-DD');

  const operatorTodayAttendance = await Attendance.findOne({
    employee_id: operatorId,
    attendance_date: today
  });

  const operatorAttendance = await Attendance.find({
    employee_id: operatorId,
    attendance_date: {
      $gte: monthStart,
      $lte: today
    }
  });

  const attendanceMap = {};

  operatorAttendance.forEach(record => {
    attendanceMap[record.attendance_date] = record;
  });

  let current = moment(monthStart);
  const todayMoment = moment();

  let totalMinutes = 0;
  let present = 0;
  let absent = 0;

  while (current.isSameOrBefore(todayMoment, 'day')) {

    const date = current.format('YYYY-MM-DD');

    if (attendanceMap[date]) {
      totalMinutes += attendanceMap[date].total_hours || 0;
      present++;
    } else {
      if (current.isBefore(todayMoment, 'day')) {
        absent++;
      }
    }

    current.add(1, 'day');
  }

  const sessions =
    operatorTodayAttendance?.sessions || [];

  const lastSession =
    sessions[sessions.length - 1] || null;

  return {
    totalEmployees,
    presentToday,
    pendingPunchOut,

    today: operatorTodayAttendance
      ? {
          punch_in:
            lastSession?.punch_in || null,

          punch_out:
            lastSession?.punch_out || null,

          total_hours:
            operatorTodayAttendance.total_hours || 0,

          late_minutes:
            operatorTodayAttendance.late_minutes || 0,

          deduction:
            operatorTodayAttendance.deduction_amount || 0,

          status:
            operatorTodayAttendance.is_active
              ? 'Active'
              : 'Completed',

          sessions
        }
      : null,

    summary: {
      hours: totalMinutes,
      present,
      absent
    }
  };
};

const getEmployeeListWithStatus = async () => {
  const today = moment().format('YYYY-MM-DD');
  const { buildActiveOperatorFilter } = require('../utils/shiftlyFilters');

  const [employees, operators] = await Promise.all([
    User.find(
      buildActiveEmployeeFilter(),
      {
        userId: 1,
        firstName: 1,
        lastName: 1,
        designation: 1,
        branch_name: 1,
        branch_id: 1,
        shift: 1,
        salary: 1,
        shift_time: 1
      }
    ).lean(),
    Admin.find(
      buildActiveOperatorFilter(),
      {
        adminId: 1,
        firstName: 1,
        lastName: 1,
        designation: 1,
        branch_name: 1,
        branch_id: 1,
        shift: 1,
        salary: 1,
        shift_time: 1
      }
    ).lean()
  ]);

  const people = [
    ...employees.map((e) => ({
      id: e.userId,
      firstName: e.firstName,
      lastName: e.lastName,
      designation: e.designation,
      branch_name: e.branch_name,
      branch_id: e.branch_id,
      shift: e.shift,
      salary: e.salary,
      shift_time: e.shift_time,
      role: e.role || 'employee'
    })),
    ...operators.map((o) => ({
      id: o.adminId,
      firstName: o.firstName,
      lastName: o.lastName,
      designation: o.designation,
      branch_name: o.branch_name,
      branch_id: o.branch_id,
      shift: o.shift,
      salary: o.salary,
      shift_time: o.shift_time,
      role: 'operator'
    }))
  ];

  const personIds = people.map((p) => p.id);

  const attendance = await Attendance.find({
    employee_id: { $in: personIds },
    attendance_date: today
  });

  const attendanceMap = {};
  attendance.forEach(a => {
    attendanceMap[a.employee_id] = a;
  });

  return people.map(emp => {
    const record = attendanceMap[emp.id] || null;
    const sessions = record && record.sessions ? record.sessions : [];
    const completedSessions = sessions.filter(s => s.punch_out);

    let status = 'ABSENT';
    if (record) {
      if (record.is_active) {
        status = record.late_minutes > 0 ? 'LATE' : 'PRESENT';
      } else if (sessions.length > 0) {
        status = record.late_minutes > 0 ? 'LATE' : 'PRESENT';
      }
    }

    return {
      user_id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      branch_name: emp.branch_name,
      branch_id: emp.branch_id,
      shift: emp.shift,
      salary: emp.salary,
      shift_time: emp.shift_time,
      role: emp.role,

      status,
      punch_in: sessions && sessions[0] && sessions[0].punch_in
        ? sessions[0].punch_in
        : null,
      punch_out:
        completedSessions &&
          completedSessions.length &&
          completedSessions[completedSessions.length - 1] &&
          completedSessions[completedSessions.length - 1].punch_out
          ? completedSessions[completedSessions.length - 1].punch_out
          : null,
      total_hours: record && record.total_hours ? record.total_hours : 0,
      late_minutes: record && record.late_minutes ? record.late_minutes : 0,
      session_count: sessions.length,
      sessions: sessions.map(s => ({
        punch_in: s.punch_in,
        punch_out: s.punch_out,
        duration: s.duration,
        punch_in_photo: s.punch_in_photo || null
      }))
    };
  });
};

const operatorPunch = async (
  employee_id,
  operator_id,
  photoUrl = null
) => {

  const now = new Date();
  const attendance_date = moment(now).format('YYYY-MM-DD');

  const staff = await findStaffById(employee_id, {
    shift_time: 1,
    branch_id: 1
  });

  if (!staff) {
    throw new Error('Employee not found');
  }

  const employee = staff.doc;

  let record = await Attendance.findOne({
    employee_id,
    attendance_date
  });

  if (!record) {

    let lateMinutes = 0;
    let deductionAmount = 0;

    if (
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

      const deductionConfig =
        await Deduction.findOne({});

      deductionAmount =
        calculateDeduction(
          lateMinutes,
          deductionConfig?.rules || []
        );
    }

    record = new Attendance({

      attendance_id:
        new mongoose.Types.ObjectId().toString(),

      employee_id,

      branch_id:
        employee.branch_id || null,

      attendance_date,

      shift_time:
        employee.shift_time || null,

      sessions: [
        {
          punch_in: now,
          punch_out: null,
          duration: 0,
          punch_in_photo: photoUrl
        }
      ],

      total_hours: 0,

      status:
        lateMinutes > 0
          ? 'LATE'
          : 'PRESENT',

      late_minutes:
        lateMinutes,

      deduction_amount:
        deductionAmount,

      is_active: true,

      punch_by: 'OPERATOR',

      operator_id

    });

    await record.save();

    await logActivity({
      operator_id,
      action_type: 'PUNCH',
      target_employee_id: employee_id,
      metadata: {
        type: 'PUNCH_IN',
        time: now
      }
    });

    await globalActivity({
      operator_id,
      action_type: 'PUNCH_IN',
      target_employee_id: employee_id,
      branch_id: record.branch_id || null,
      metadata: {
        type: 'PUNCH_IN',
        time: now
      }
    });

    return {
      type: 'PUNCH_IN',
      message: 'Punch In successful'
    };
  }

  if (record.is_active) {

    const activeSession =
      record.sessions
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
          now.getTime() -
          new Date(activeSession.punch_in).getTime()
        ) /
        (1000 * 60)
      );

      activeSession.punch_out = now;
      activeSession.duration = duration;
      activeSession.punch_out_photo = photoUrl;
    }

    const totalMinutes =
      record.sessions.reduce(
        (
          sum,
          session
        ) =>
          sum +
          (session.duration || 0),
        0
      );

    record.total_hours =
      totalMinutes;

    record.is_active = false;

    record.punch_by =
      'OPERATOR';

    record.operator_id =
      operator_id;

    record.updated_at =
      now;

    record.markModified(
      'sessions'
    );

    await record.save();

    await logActivity({
      operator_id,
      action_type: 'PUNCH',
      target_employee_id: employee_id,
      metadata: {
        type: 'PUNCH_OUT',
        time: now
      }
    });

    await globalActivity({
      operator_id,
      action_type: 'PUNCH_OUT',
      target_employee_id: employee_id,
      branch_id: record.branch_id || null,
      metadata: {
        type: 'PUNCH_OUT',
        time: now,
        total_hours: totalMinutes
      }
    });

    return {
      type: 'PUNCH_OUT',
      message: 'Punch Out successful',
      total_hours: totalMinutes
    };
  }

  record.sessions.push({

    punch_in: now,

    punch_out: null,

    duration: 0,

    punch_in_photo: photoUrl

  });

  record.is_active = true;

  record.punch_by = 'OPERATOR';

  record.operator_id =
    operator_id;

  record.updated_at =
    now;

  record.markModified(
    'sessions'
  );

  await record.save();

  await logActivity({
    operator_id,
    action_type: 'PUNCH',
    target_employee_id: employee_id,
    metadata: {
      type: 'PUNCH_IN',
      time: now
    }
  });

  await globalActivity({
    operator_id,
    action_type: 'PUNCH_IN',
    target_employee_id: employee_id,
    branch_id: record.branch_id || null,
    metadata: {
      type: 'PUNCH_IN',
      time: now
    }
  });

  return {
    type: 'PUNCH_IN',
    message: 'Punch In successful'
  };
};

const punch = async (employee_id, branch_id, photoUrl = null) => {

  const now = new Date();
  const attendance_date = moment(now).format('YYYY-MM-DD');

  const operator = await Admin.findOne(
    { adminId: employee_id },
    { shift_time: 1 }
  );

  let record = await Attendance.findOne({
    employee_id,
    attendance_date
  });

  if (!record) {

    let lateMinutes = 0;
    let deductionAmount = 0;

    if (
      operator &&
      operator.shift_time &&
      operator.shift_time.trim() !== ''
    ) {
      const [hours, minutes] = operator.shift_time
        .split(':')
        .map(Number);

      const shiftStart = moment(now)
        .startOf('day')
        .add(hours, 'hours')
        .add(minutes, 'minutes');

      const actualIn = moment(now);

      if (actualIn.isAfter(shiftStart)) {
        lateMinutes = actualIn.diff(shiftStart, 'minutes');
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
      shift_time: operator?.shift_time || null,

      sessions: [{
        punch_in: now,
        punch_out: null,
        duration: 0,
        punch_in_photo: photoUrl
      }],

      total_hours: 0,

      status: lateMinutes > 0 ? 'LATE' : 'PRESENT',

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

  if (record.is_active) {

    const activeSession = record.sessions
      .slice()
      .reverse()
      .find(s => s.punch_in && !s.punch_out);

    if (activeSession) {
      const duration = Math.floor(
        (now - new Date(activeSession.punch_in)) / (1000 * 60)
      );

      activeSession.punch_out = now;
      activeSession.duration = duration;
      activeSession.punch_out_photo = photoUrl;
    }

    const totalMinutes = record.sessions.reduce(
      (sum, session) => sum + (session.duration || 0),
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

const changeShift = async (employee_id, new_shift, third, fourth) => {

  let shift_time = null;
  let operator_id;

  if (fourth !== undefined) {
    shift_time = third;
    operator_id = fourth;
  } else {
    operator_id = third;
  }

  const staff = await findStaffById(employee_id);

  if (!staff) {
    throw new Error('Employee not found');
  }

  const employee = staff.doc;

  const oldShift = employee.shift || 'Morning';

  employee.shift = new_shift;
  if (shift_time) {
    employee.shift_time = shift_time;
  }
  await employee.save();

  await ShiftHistory.create({
    history_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    old_shift: oldShift,
    new_shift,
    changed_by: 'OPERATOR',
    operator_id
  });

  await logActivity({
    operator_id,
    branch_id: employee.branch_id,
    action_type: 'SHIFT_CHANGE',
    target_employee_id: employee_id,
    metadata: {
      old_shift: oldShift,
      new_shift: new_shift
    }
  });

  await globalActivity({
    operator_id: operator_id,
    action_type: 'SHIFT_CHANGE',
    target_employee_id: employee_id,
    branch_id: employee.branch_id || null,
    metadata: {
      old_shift: oldShift,
      new_shift: new_shift
    }
  });

  return {
    message: 'Shift updated successfully',
    old_shift: oldShift,
    new_shift
  };
};

const changeBranch = async (employee_id, new_branch_id, operator_id) => {

  const staff = await findStaffById(employee_id);

  if (!staff) {
    throw new Error('Employee not found');
  }

  const employee = staff.doc;

  if (employee.branch_id === new_branch_id) {
    throw new Error('Employee already in this branch');
  }

  const branch = await Branch.findOne({ branch_id: new_branch_id });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const oldBranchId = employee.branch_id;
  const oldBranchName = employee.branch_name;

  employee.branch_id = branch.branch_id;
  employee.branch_name = branch.branch_name;

  await employee.save();

  await BranchHistory.create({
    history_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    old_branch_id: oldBranchId,
    old_branch_name: oldBranchName,
    new_branch_id: branch.branch_id,
    new_branch_name: branch.branch_name,
    changed_by: 'OPERATOR',
    operator_id
  });

  await logActivity({
    operator_id,
    branch_id: branch.branch_id,
    action_type: 'BRANCH_CHANGE',
    target_employee_id: employee_id,
    metadata: {
      old_branch: oldBranchName,
      new_branch: branch.branch_name
    }
  });

  await globalActivity({
    operator_id: operator_id,
    action_type: 'BRANCH_CHANGE',
    target_employee_id: employee_id,
    branch_id: employee.branch_id || null,
    metadata: {
      old_branch: oldBranchName,
      new_branch: branch.branch_name
    }
  });

  return {
    message: 'Branch updated successfully',
    old_branch: oldBranchName,
    new_branch: branch.branch_name
  };
};

const addFine = async (
  employee_id,
  amount,
  reason,
  operator_id
) => {

  const staff = await findStaffById(employee_id);

  if (!staff) {
    throw new Error('Employee not found');
  }

  const employee = staff.doc;

  if (!amount || amount <= 0) {
    throw new Error('Invalid fine amount');
  }

  const month = moment().format('YYYY-MM');

  await Fine.create({

    fine_id:
      new mongoose.Types.ObjectId().toString(),

    employee_id,

    operator_id,

    branch_id:
      employee.branch_id || null,

    amount,

    reason,

    month,

    apply_to: 'CURRENT',

    salary_processed: false,

    added_by: operator_id,

    fine_date: moment().format('YYYY-MM-DD')

  });

  await logActivity({
    operator_id,
    branch_id: employee.branch_id,
    action_type: 'FINE',
    target_employee_id: employee_id,
    metadata: {
      amount,
      reason
    }
  });

  await globalActivity({
    operator_id: operator_id,
    action_type: 'FINE',
    target_employee_id: employee_id,
    branch_id: employee.branch_id || null,
    metadata: {
      amount,
      reason
    }
  });

  return {
    message: 'Fine added successfully',
    amount,
    employee:
      `${employee.firstName} ${employee.lastName}`
  };
};

const getRecentActivity = async (operator_id) => {

  const activities = await OperatorActivity.find({
    operator_id
  })
    .sort({ created_at: -1 })
    .limit(10);

  const employeeIds = activities
    .map(a => a.target_employee_id)
    .filter(Boolean);

  const users = await User.find(
    { userId: { $in: employeeIds } },
    { userId: 1, firstName: 1, lastName: 1 }
  );

  const userMap = {};
  users.forEach(u => {
    userMap[u.userId] = `${u.firstName} ${u.lastName}`;
  });

  return activities.map(a => {

    const employeeName = userMap[a.target_employee_id] || 'Employee';

    let text = '';

    switch (a.action_type) {

      case 'FINE':
        text = `Fine added for ${employeeName} (₹${a.metadata && a.metadata.amount ? a.metadata.amount : 0
          })`;
        break;

      case 'PUNCH': {
        const punchType =
          a.metadata && a.metadata.type === 'PUNCH_IN'
            ? 'Punch-in'
            : 'Punch-out';

        text = `${punchType} done for ${employeeName}`;
        break;
      }

      case 'SHIFT_CHANGE':
        text = `Shift changed for ${employeeName} (${a.metadata && a.metadata.new_shift ? a.metadata.new_shift : ''
          })`;
        break;

      case 'BRANCH_CHANGE':
        text = `Branch changed for ${employeeName} (${a.metadata && a.metadata.new_branch ? a.metadata.new_branch : ''
          })`;
        break;

      default:
        text = `Activity for ${employeeName}`;
    }

    return {
      text,
      time: moment(a.created_at).fromNow()
    };
  });
};

const getAttendanceControl = async (branch_id) => {
  const today = moment().format('YYYY-MM-DD');
  const { buildActiveOperatorFilter } = require('../utils/shiftlyFilters');

  const [employees, operators] = await Promise.all([
    User.find(
      buildActiveEmployeeFilter(branch_id || ''),
      { userId: 1, firstName: 1, lastName: 1, designation: 1, branch_name: 1 }
    ).lean(),
    Admin.find(
      buildActiveOperatorFilter(branch_id || ''),
      { adminId: 1, firstName: 1, lastName: 1, designation: 1, branch_name: 1 }
    ).lean()
  ]);

  const people = [
    ...employees.map((e) => ({
      id: e.userId,
      firstName: e.firstName,
      lastName: e.lastName,
      designation: e.designation,
      branch_name: e.branch_name,
      role: 'employee'
    })),
    ...operators.map((o) => ({
      id: o.adminId,
      firstName: o.firstName,
      lastName: o.lastName,
      designation: o.designation,
      branch_name: o.branch_name,
      role: 'operator'
    }))
  ];

  const personIds = people.map((p) => p.id);

  const attendance = await Attendance.find({
    employee_id: { $in: personIds },
    attendance_date: today
  });

  const attendanceMap = {};
  attendance.forEach(a => { attendanceMap[a.employee_id] = a; });

  let present = 0;
  let absent = 0;
  let late = 0;

  const result = people.map(emp => {
    const record = attendanceMap[emp.id];

    let status = 'ABSENT';
    let punch_in = null;
    let punch_out = null;
    let total_hours = 0;
    let sessionCount = 0;

    if (record) {
      const sessions = record.sessions || [];
      sessionCount = sessions.length;

      punch_in =
        sessions && sessions.length && sessions[0].punch_in
          ? sessions[0].punch_in
          : null;

      const completedSessions = sessions.filter((s) => s.punch_out);
      punch_out =
        completedSessions &&
          completedSessions.length &&
          completedSessions[completedSessions.length - 1] &&
          completedSessions[completedSessions.length - 1].punch_out
          ? completedSessions[completedSessions.length - 1].punch_out
          : null;

      total_hours = record.total_hours || 0;

      if (record.is_active) {
        status = 'IN';
      } else if (sessions.length > 0) {
        status = 'OUT';
      }

      if (record.late_minutes > 0) {
        status = status === 'IN' ? 'IN' : 'LATE';
        late++;
        present++;
      } else {
        present++;
      }

    } else {
      absent++;
    }

    return {
      employee_id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      branch: emp.branch_name,
      role: emp.role,
      status,
      punch_in,
      punch_out,
      total_hours,
      session_count: sessionCount
    };
  });

  return {
    summary: { present, absent, late },
    employees: result
  };
};

const getOperatorProfile = async (operator_id) => {

  const operator = await Admin.findOne(
    { adminId: operator_id },
    {
      adminId: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      role: 1,
      mobileNumber: 1,
      branch_id: 1,
      branch_name: 1,
      status: 1,
      designation: 1
    }
  );

  if (!operator) {
    throw new Error('Operator not found');
  }

  const employees = await User.find(
    buildActiveEmployeeFilter(),
    { userId: 1 }
  );

  const employeeIds = employees.map(e => e.userId);

  const today = moment().format('YYYY-MM-DD');

  const attendance = await Attendance.find({
    employee_id: { $in: employeeIds },
    attendance_date: today
  });

  const presentToday = attendance.length;

  const permissions = {
    overwriteAttendance: true,
    manualPunch: true
  };

  return {
    profile: {
      name: `${operator.firstName} ${operator.lastName}`,
      role: operator.role,
      branch: operator.branch_name || '',
      status: operator.status || 'Active',

      employeeId: operator.adminId,
      phone: operator.mobileNumber || '',
      email: operator.email,
      designation: operator.designation || ''
    },

    permissions,

    stats: {
      totalEmployees: employeeIds.length,
      presentToday
    }
  };
};

const addAdvance = async ({
  employee_id,
  branch_id,
  amount,
  reason,
  month,
  added_by
}) => {

  let existing =
    await Advance.findOne({
      employee_id,
      month
    });

  if (existing) {

    existing.amount += Number(amount);

    existing.reason =
      existing.reason
        ? `${existing.reason}, ${reason}`
        : reason;

    existing.updated_at =
      new Date();

    await existing.save();

    return existing;
  }

  const advance =
    new Advance({

      advance_id:
        new mongoose.Types.ObjectId().toString(),

      employee_id,
      branch_id,

      amount,

      reason,

      month,

      added_by
    });

  await logActivity({
    operator_id: added_by,
    branch_id,
    action_type: 'ADVANCE',
    target_employee_id: employee_id,
    metadata: {
      amount,
      reason
    }
  });

  await globalActivity({
    operator_id: added_by,
    action_type: 'ADVANCE',
    target_employee_id: employee_id,
    branch_id,
    metadata: {
      amount,
      reason,
      month
    }
  });

  await advance.save();

  return advance;
};

module.exports = {
  getOperatorDashboard,
  getEmployeeListWithStatus,
  operatorPunch,
  changeShift,
  changeBranch,
  addFine,
  getRecentActivity,
  getAttendanceControl,
  getOperatorProfile,
  addAdvance,
  punch,
  attachPunchPhoto
};
