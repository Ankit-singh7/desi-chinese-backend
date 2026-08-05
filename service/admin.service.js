const mongoose = require('mongoose');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Kolkata');

const User = mongoose.model('User');
const Admin = mongoose.model('Admin');
const Attendance = mongoose.model('attendance');
const Branch = mongoose.model('branch');
const Incentive = mongoose.model('incentive');
const Advance = mongoose.model('advance');
const PayrollAdjustment = mongoose.model('payroll_adjustment');
const EmployeePayroll = mongoose.model('employee_payroll');
const Fine = mongoose.model('employee_fine');
const EmployeeNote = mongoose.model('employee_note');
const Deduction = mongoose.model('deduction');
const { uploadToDrive, createEmployeeFolder } = require('../service/google-drive.service');
const { globalActivity } = require('../libs/loggerLib');
const {
  buildActiveEmployeeFilter,
  buildActiveOperatorFilter
} = require('../utils/shiftlyFilters');

const ROOT_FOLDER_ID = '1W5m6_WUZDGV_WbusPQtCLQe9rYNBSX4k';

const calculateDeduction = (lateMinutes, rules = []) => {
  let deduction = 0;
  for (let rule of rules) {
    if (lateMinutes >= rule.late_minutes) {
      deduction = rule.deduction;
    }
  }
  return deduction;
};

// Map restaurant User/Admin fields → Shiftly frontend field names
const normalizeEmployeeForFrontend = (doc) => {
  if (!doc) return null;

  const isAdmin = !!doc.adminId && !doc.userId;

  return {
    user_id: doc.userId || doc.adminId,
    f_name: doc.firstName || '',
    l_name: doc.lastName || '',
    phone: doc.mobileNumber || '',
    branch_id: doc.branch_id || '',
    branch_name: doc.branch_name || '',
    email: doc.email || '',
    // Restaurant POS users often have empty role — treat as employee for Shiftly
    role: doc.role || (isAdmin ? 'operator' : 'employee'),
    designation: doc.designation || '',
    shift: doc.shift || '',
    salary: doc.salary ?? null,
    status: doc.status || 'Active',
    documents: doc.documents || {},
    shift_time: doc.shift_time || ''
  };
};

const getEmployeeDisplayName = (doc) => {
  if (!doc) return '';
  return `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
};

const findPersonById = async (personId) => {
  const user = await User.findOne({ userId: personId }).lean();
  if (user) return user;

  return Admin.findOne({ adminId: personId }).lean();
};

const resolvePersonNames = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return {};

  const [users, admins] = await Promise.all([
    User.find(
      { userId: { $in: uniqueIds } },
      { userId: 1, firstName: 1, lastName: 1 }
    ).lean(),
    Admin.find(
      { adminId: { $in: uniqueIds } },
      { adminId: 1, firstName: 1, lastName: 1 }
    ).lean()
  ]);

  const nameMap = {};
  users.forEach((u) => {
    nameMap[u.userId] = getEmployeeDisplayName(u);
  });
  admins.forEach((a) => {
    nameMap[a.adminId] = getEmployeeDisplayName(a);
  });

  return nameMap;
};

const getPayrollEligiblePeople = async (branch_id = '') => {
  const [employees, operators] = await Promise.all([
    User.find(buildActiveEmployeeFilter(branch_id)).lean(),
    Admin.find(buildActiveOperatorFilter(branch_id)).lean()
  ]);

  return { employees, operators };
};

/** Admin employee list — employees + operators, Shiftly field names */
const getEmployeeList = async () => {
  const { employees, operators } = await getPayrollEligiblePeople();

  return [
    ...employees.map((e) => normalizeEmployeeForFrontend(e)),
    ...operators.map((o) => normalizeEmployeeForFrontend(o))
  ];
};

const getAdminDashboard = async (branch_id) => {
  const today = moment().format('YYYY-MM-DD');
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();

  const { employees, operators } = await getPayrollEligiblePeople(branch_id);
  const employeeIds = [
    ...employees.map((e) => e.userId),
    ...operators.map((o) => o.adminId)
  ];

  const totalEmployees = employeeIds.length;
  const totalBranches = await Branch.countDocuments();

  const todayAttendance = await Attendance.find({
    employee_id: { $in: employeeIds },
    attendance_date: today
  });

  const todayPresent = todayAttendance.length;
  const todayIn = todayAttendance.filter((a) => a.is_active).length;
  const todayOut = todayAttendance.filter((a) => !a.is_active).length;

  const fines = await Fine.aggregate([
    {
      $match: {
        employee_id: { $in: employeeIds },
        created_at: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalFines = fines.length ? fines[0].total : 0;

  const currentMonth = moment().format('YYYY-MM');
  const paidPayrolls = await EmployeePayroll.find({
    employee_id: { $in: employeeIds },
    month: currentMonth,
    status: 'PAID'
  })
    .select('employee_id')
    .lean();

  const paidIds = new Set(paidPayrolls.map((p) => p.employee_id));
  const pendingSalary = employeeIds.filter((id) => !paidIds.has(id)).length;

  const payroll = await EmployeePayroll.aggregate([
    {
      $match: {
        employee_id: { $in: employeeIds },
        month: currentMonth
      }
    },
    { $group: { _id: null, total: { $sum: '$net_salary' } } }
  ]);

  const totalPayroll = payroll.length ? payroll[0].total : 0;
  const totalIncentives = 0;

  return {
    overview: {
      totalEmployees,
      totalBranches,
      todayPresent,
      pendingSalary
    },
    monthly: {
      todayIn,
      todayOut,
      incentives: totalIncentives,
      fines: totalFines,
      payroll: totalPayroll
    }
  };
};

const createEmployee = async (data, files) => {
  const fullName = `${data?.f_name || ''} ${data?.l_name || ''}`.trim();
  const role = String(data?.role || 'employee').toLowerCase();

  const employeeFolderId = await createEmployeeFolder(fullName, ROOT_FOLDER_ID);

  let aadhaarUrl = null;
  let panUrl = null;

  if (files?.aadhaar) {
    aadhaarUrl = await uploadToDrive(files.aadhaar[0], employeeFolderId);
  }

  if (files?.pan) {
    panUrl = await uploadToDrive(files.pan[0], employeeFolderId);
  }

  const documents = {
    aadhaar_url: aadhaarUrl,
    pan_url: panUrl
  };

  // Restaurant split:
  // - employee → User collection
  // - operator / admin → Admin collection
  if (role === 'operator' || role === 'admin') {
    const existingAdmin = await Admin.findOne({ email: data.email });
    if (existingAdmin) {
      throw new Error('Email already exists for an admin/operator');
    }

    const newAdmin = new Admin({
      adminId: new mongoose.Types.ObjectId().toString(),
      firstName: data.f_name,
      lastName: data.l_name,
      email: data.email,
      mobileNumber: data.phone,
      password: data.password,
      role,
      designation: data.designation,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
      shift: data.shift,
      salary: data.salary,
      status: 'Active',
      shift_time: data.shift_time,
      documents,
      createdOn: new Date()
    });

    await newAdmin.save();
    return normalizeEmployeeForFrontend(newAdmin.toObject());
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Email already exists for a user');
  }

  const newUser = new User({
    userId: new mongoose.Types.ObjectId().toString(),
    firstName: data.f_name,
    lastName: data.l_name,
    email: data.email,
    mobileNumber: data.phone,
    password: data.password,
    role: 'employee',
    designation: data.designation,
    branch_id: data.branch_id,
    branch_name: data.branch_name,
    shift: data.shift,
    salary: data.salary,
    status: 'Active',
    shift_time: data.shift_time,
    documents
  });

  await newUser.save();
  return normalizeEmployeeForFrontend(newUser.toObject());
};

const adminOverwriteAttendance = async (
  employee_id,
  branch_id,
  admin_id,
  date,
  sessions = []
) => {
  const attendance_date = moment(date).format('YYYY-MM-DD');

  const employee =
    (await User.findOne({ userId: employee_id }, { shift_time: 1 })) ||
    (await Admin.findOne({ adminId: employee_id }, { shift_time: 1 }));

  const buildDateTime = (dateStr, timeStr) => {
    if (!timeStr || timeStr.trim() === '') {
      return null;
    }

    const [hours, minutes] = timeStr.split(':');

    if (!hours || !minutes) {
      return null;
    }

    const dt = moment(dateStr, 'YYYY-MM-DD').toDate();

    dt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    return dt;
  };

  const attendanceSessions = sessions.map((session) => {
    const punchIn = buildDateTime(attendance_date, session.in);
    const punchOut = buildDateTime(attendance_date, session.out);

    let duration = 0;

    if (punchIn && punchOut) {
      duration = Math.floor(
        (punchOut.getTime() - punchIn.getTime()) / (1000 * 60)
      );
    }

    return {
      punch_in: punchIn,
      punch_out: punchOut,
      duration
    };
  });

  const firstPunchIn =
    attendanceSessions.find((s) => s.punch_in)?.punch_in || null;

  const activeSession = attendanceSessions.find(
    (s) => s.punch_in && !s.punch_out
  );

  const totalHours = attendanceSessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );

  let lateMinutes = 0;

  if (
    firstPunchIn &&
    employee?.shift_time &&
    employee.shift_time.trim() !== ''
  ) {
    const [hours, minutes] = employee.shift_time.split(':').map(Number);

    const shiftStart = moment(attendance_date)
      .startOf('day')
      .add(hours, 'hours')
      .add(minutes, 'minutes');

    const actualIn = moment(firstPunchIn);

    if (actualIn.isAfter(shiftStart)) {
      lateMinutes = actualIn.diff(shiftStart, 'minutes');
    }
  }

  let deductionAmount = 0;

  if (employee?.shift_time) {
    const deductionConfig = await Deduction.findOne({});
    deductionAmount = calculateDeduction(
      lateMinutes,
      deductionConfig?.rules || []
    );
  }

  let status = 'ABSENT';

  if (attendanceSessions.length > 0) {
    status = lateMinutes > 0 ? 'LATE' : 'PRESENT';
  }

  let record = await Attendance.findOne({
    employee_id,
    attendance_date
  });

  if (!record) {
    record = new Attendance({
      attendance_id: new mongoose.Types.ObjectId().toString(),
      employee_id,
      branch_id,
      attendance_date,
      shift_time: employee?.shift_time || null,
      sessions: attendanceSessions,
      total_hours: totalHours,
      status,
      late_minutes: lateMinutes,
      deduction_amount: deductionAmount,
      is_active: !!activeSession,
      punch_by: 'ADMIN',
      overwritten_by: admin_id
    });

    await record.save();

    await globalActivity({
      operator_id: 'admin',
      action_type: 'OVERWRITE_ATTENDANCE',
      target_employee_id: employee_id,
      metadata: {
        attendance_date,
        sessions_count: attendanceSessions.length
      }
    });

    return {
      type: 'CREATED',
      message: 'Attendance created successfully'
    };
  }

  record.shift_time = employee?.shift_time || null;
  record.sessions = attendanceSessions;
  record.total_hours = totalHours;
  record.status = status;
  record.late_minutes = lateMinutes;
  record.deduction_amount = deductionAmount;
  record.is_active = !!activeSession;
  record.punch_by = 'ADMIN';
  record.overwritten_by = admin_id;
  record.updated_at = new Date();
  record.markModified('sessions');

  await record.save();

  await globalActivity({
    operator_id: 'admin',
    action_type: 'OVERWRITE_ATTENDANCE',
    target_employee_id: employee_id,
    metadata: {
      attendance_date,
      sessions_count: attendanceSessions.length
    }
  });

  return {
    type: 'OVERWRITTEN',
    message: 'Attendance overwritten successfully'
  };
};

const saveIncentive = async (data) => {
  const { employee_id, branch_id, amount, reason, month, added_by } = data;

  const incentive = new Incentive({
    incentive_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    branch_id,
    amount,
    reason,
    month,
    added_by
  });

  await globalActivity({
    operator_id: 'admin',
    action_type: 'INCENTIVE',
    target_employee_id: employee_id,
    branch_id,
    metadata: {
      amount,
      reason,
      month
    }
  });

  await incentive.save();

  return incentive;
};

const getIncentiveList = async (month, branch_id, employee_id) => {
  const query = { month };
  if (branch_id) query.branch_id = branch_id;
  if (employee_id) query.employee_id = employee_id;
  return Incentive.find(query).sort({ created_at: -1 });
};

const removeIncentive = async (incentive_id) => {
  return Incentive.findOneAndDelete({ incentive_id });
};

const saveAdvance = async (data) => {
  const { employee_id, branch_id, amount, reason, month, added_by } = data;

  const advance = new Advance({
    advance_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    branch_id,
    amount,
    reason,
    month,
    added_by
  });

  await globalActivity({
    operator_id: 'admin',
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

const getAdvanceList = async (month, branch_id, employee_id) => {
  const query = { month };
  if (branch_id) query.branch_id = branch_id;
  if (employee_id) query.employee_id = employee_id;
  return Advance.find(query).sort({ created_at: -1 });
};

const removeAdvance = async (advance_id) => {
  return Advance.findOneAndDelete({ advance_id });
};

const savePayrollAdjustment = async (
  employee_id,
  branch_id,
  month,
  paid_leave_days,
  festival_days,
  updated_by
) => {
  let adjustment = await PayrollAdjustment.findOne({
    employee_id,
    month
  });

  if (adjustment) {
    adjustment.paid_leave_days = paid_leave_days;
    adjustment.festival_days = festival_days;
    adjustment.updated_by = updated_by;
    adjustment.updated_at = new Date();

    await adjustment.save();

    return adjustment;
  }

  adjustment = new PayrollAdjustment({
    adjustment_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    branch_id,
    month,
    paid_leave_days,
    festival_days,
    updated_by
  });

  await adjustment.save();

  return adjustment;
};

const getEmployeePayrollPreview = async (employee_id, month) => {
  const employee = await findPersonById(employee_id);

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.salary) {
    throw new Error(
      `${getEmployeeDisplayName(employee)} salary not configured`
    );
  }

  const startDate = moment(month + '-01')
    .startOf('month')
    .format('YYYY-MM-DD');

  const endDate = moment(month + '-01')
    .endOf('month')
    .format('YYYY-MM-DD');

  const attendances = await Attendance.find({
    employee_id,
    attendance_date: {
      $gte: startDate,
      $lte: endDate
    }
  });

  const workedMinutes = attendances.reduce((totalMinutes, attendance) => {
    const sessionMinutes = (attendance.sessions || []).reduce(
      (sessionTotal, session) =>
        sessionTotal + Number(session.duration || 0),
      0
    );

    return totalMinutes + sessionMinutes;
  }, 0);

  const totalLateMinutes = attendances.reduce(
    (sum, item) => sum + (item.late_minutes || 0),
    0
  );

  const adjustment = await PayrollAdjustment.findOne({
    employee_id,
    month
  });

  const paidLeaveDays = adjustment?.paid_leave_days || 0;
  const festivalDays = adjustment?.festival_days || 0;

  const paidLeaveMinutes = paidLeaveDays * 600;
  const festivalMinutes = festivalDays * 600;

  const payableMinutes =
    workedMinutes + paidLeaveMinutes + festivalMinutes;

  const monthlyMinutes = 18000;

  const perMinuteRate = employee.salary / monthlyMinutes;

  const earnedSalary = payableMinutes * perMinuteRate;

  const lateDeduction = totalLateMinutes * perMinuteRate;

  const incentive = (
    await Incentive.find({
      employee_id,
      month
    })
  ).reduce((sum, item) => sum + (item.amount || 0), 0);

  const advance = (
    await Advance.find({
      employee_id,
      month
    })
  ).reduce((sum, item) => sum + (item.amount || 0), 0);

  const fines = await Fine.find({
    employee_id,
    month,
    salary_processed: false,
    apply_to: 'CURRENT'
  });

  const fine = fines.reduce((sum, item) => sum + (item.amount || 0), 0);

  const netSalary =
    earnedSalary + incentive - fine - advance - lateDeduction;

  const formula = `((${workedMinutes}+${paidLeaveMinutes}+${festivalMinutes})×${perMinuteRate.toFixed(4)})+${incentive}-${fine}-${advance}-${lateDeduction}`;

  const existingPayroll = await EmployeePayroll.findOne({
    employee_id,
    month
  }).lean();

  const personId = employee.userId || employee.adminId;

  return {
    employee_id: personId,
    employee_name: getEmployeeDisplayName(employee),
    branch_id: employee.branch_id || '',
    branch_name: employee.branch_name || '',
    base_salary: employee.salary,
    monthly_minutes: monthlyMinutes,
    worked_minutes: workedMinutes,
    paid_leave_minutes: paidLeaveMinutes,
    festival_minutes: festivalMinutes,
    payable_minutes: payableMinutes,
    total_late_minutes: totalLateMinutes,
    per_minute_rate: perMinuteRate,
    earned_salary: Math.round(earnedSalary),
    incentive,
    fine,
    advance,
    late_deduction: Math.round(lateDeduction),
    net_salary: Math.round(netSalary),
    salary_formula: formula,
    fine_ids: fines.map((item) => item._id),
    payroll_id: existingPayroll?.payroll_id || null,
    status: existingPayroll?.status || 'DRAFT',
    generated: !!existingPayroll
  };
};

const generateEmployeePayroll = async (employee_id, month, admin_id) => {
  const preview = await getEmployeePayrollPreview(employee_id, month);

  let payroll = await EmployeePayroll.findOne({
    employee_id,
    month
  });

  if (
    payroll &&
    (payroll.status === 'LOCKED' || payroll.status === 'PAID')
  ) {
    throw new Error(`Payroll already ${payroll.status}`);
  }

  if (!payroll) {
    payroll = new EmployeePayroll({
      payroll_id: new mongoose.Types.ObjectId().toString(),
      employee_id: preview.employee_id,
      employee_name: preview.employee_name,
      branch_id: preview.branch_id,
      month,
      base_salary: preview.base_salary,
      monthly_minutes: preview.monthly_minutes,
      worked_minutes: preview.worked_minutes,
      paid_leave_minutes: preview.paid_leave_minutes,
      festival_minutes: preview.festival_minutes,
      payable_minutes: preview.payable_minutes,
      total_late_minutes: preview.total_late_minutes,
      per_minute_rate: preview.per_minute_rate,
      earned_salary: preview.earned_salary,
      incentive: preview.incentive,
      fine: preview.fine,
      advance: preview.advance,
      late_deduction: preview.late_deduction,
      net_salary: preview.net_salary,
      salary_formula: preview.salary_formula,
      status: 'GENERATED',
      generated_by: admin_id,
      generated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });
  } else {
    payroll.employee_name = preview.employee_name;
    payroll.branch_id = preview.branch_id;
    payroll.base_salary = preview.base_salary;
    payroll.monthly_minutes = preview.monthly_minutes;
    payroll.worked_minutes = preview.worked_minutes;
    payroll.paid_leave_minutes = preview.paid_leave_minutes;
    payroll.festival_minutes = preview.festival_minutes;
    payroll.payable_minutes = preview.payable_minutes;
    payroll.total_late_minutes = preview.total_late_minutes;
    payroll.per_minute_rate = preview.per_minute_rate;
    payroll.earned_salary = preview.earned_salary;
    payroll.incentive = preview.incentive;
    payroll.fine = preview.fine;
    payroll.advance = preview.advance;
    payroll.late_deduction = preview.late_deduction;
    payroll.net_salary = preview.net_salary;
    payroll.salary_formula = preview.salary_formula;
    payroll.generated_by = admin_id;
    payroll.generated_at = new Date();
    payroll.updated_at = new Date();
  }

  await payroll.save();

  if (preview.fine_ids && preview.fine_ids.length) {
    await Fine.updateMany(
      { _id: { $in: preview.fine_ids } },
      { $set: { salary_processed: true } }
    );
  }

  return payroll;
};

const getPayrollEmployees = async (month, branch_id = '') => {
  const { employees, operators } = await getPayrollEligiblePeople(branch_id);

  const allPeople = [
    ...employees.map((e) => ({ ...e, _personId: e.userId })),
    ...operators.map((o) => ({ ...o, _personId: o.adminId }))
  ];

  const payrolls = await EmployeePayroll.find({ month }).lean();
  const payrollMap = new Map();
  payrolls.forEach((payroll) => payrollMap.set(payroll.employee_id, payroll));

  return allPeople.map((person) => {
    const payroll = payrollMap.get(person._personId);
    const normalized = normalizeEmployeeForFrontend(person);

    return {
      employee_id: normalized.user_id,
      employee_name: `${normalized.f_name} ${normalized.l_name}`.trim(),
      branch_id: normalized.branch_id,
      branch_name: normalized.branch_name,
      designation: normalized.designation,
      role: normalized.role,
      salary: normalized.salary || 0,
      payroll_generated: !!payroll,
      payroll_status: payroll ? payroll.status : 'NOT_GENERATED',
      net_salary: payroll ? payroll.net_salary : 0,
      generated_at: payroll?.generated_at || null,
      paid_at: payroll?.paid_at || null,
      locked_at: payroll?.locked_at || null
    };
  });
};

const lockEmployeePayroll = async (employee_id, month, admin_id) => {
  const payroll = await EmployeePayroll.findOne({
    employee_id,
    month
  });

  if (!payroll) {
    throw new Error('Payroll not generated');
  }

  if (payroll.status === 'PAID') {
    throw new Error('Payroll already paid');
  }

  payroll.status = 'LOCKED';
  payroll.locked_by = admin_id;
  payroll.locked_at = new Date();
  payroll.updated_at = new Date();

  await payroll.save();

  return payroll;
};

const markEmployeePayrollPaid = async (employee_id, month, admin_id) => {
  const payroll = await EmployeePayroll.findOne({
    employee_id,
    month
  });

  if (!payroll) {
    throw new Error('Payroll not generated');
  }

  if (payroll.status === 'PAID') {
    throw new Error('Salary already paid');
  }

  const snapshot = await getEmployeePayrollSlip(employee_id, month);

  payroll.status = 'PAID';
  payroll.payroll_snapshot = snapshot;
  payroll.paid_by = admin_id;
  payroll.paid_at = new Date();
  payroll.updated_at = new Date();

  await payroll.save();

  return payroll;
};

const getEmployeePayroll = async (employee_id, month) => {
  return EmployeePayroll.findOne({
    employee_id,
    month
  });
};

const getEmployeePayrollSlip = async (employee_id, month) => {
  const payroll = await EmployeePayroll.findOne({
    employee_id,
    month
  }).lean();

  if (!payroll) {
    throw new Error('Salary not generated yet');
  }

  if (payroll.status === 'PAID' && payroll.payroll_snapshot) {
    return payroll.payroll_snapshot;
  }

  const employee = await findPersonById(employee_id);

  if (!employee) {
    throw new Error('Employee not found');
  }

  const startDate = moment(month + '-01')
    .startOf('month')
    .format('YYYY-MM-DD');

  const endDate = moment(month + '-01')
    .endOf('month')
    .format('YYYY-MM-DD');

  const attendances = await Attendance.find({
    employee_id,
    attendance_date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ attendance_date: 1 })
    .lean();

  const attendanceRows = attendances.map((att) => ({
    date: att.attendance_date,
    status: att.status,
    sessions: att.sessions || [],
    worked_minutes: (att.sessions || []).reduce(
      (sum, session) => sum + Number(session.duration || 0),
      0
    ),
    late_minutes: att.late_minutes || 0
  }));

  const incentives = await Incentive.find({
    employee_id,
    month
  }).lean();

  const advances = await Advance.find({
    employee_id,
    month
  }).lean();

  const fines = await Fine.find({
    employee_id,
    month,
    salary_processed: true
  }).lean();

  const notes = await EmployeeNote.find({
    employee_id
  })
    .sort({ created_at: -1 })
    .lean();

  const presentDays = attendanceRows.filter(
    (x) => x.status === 'PRESENT' || x.status === 'LATE'
  ).length;

  const lateDays = attendanceRows.filter((x) => x.status === 'LATE').length;

  const absentDays = attendanceRows.filter(
    (x) => x.status === 'ABSENT'
  ).length;

  const normalized = normalizeEmployeeForFrontend(employee);

  return {
    employee: {
      employee_id: normalized.user_id,
      employee_name: `${normalized.f_name} ${normalized.l_name}`.trim(),
      branch_name: normalized.branch_name,
      designation: normalized.designation,
      phone: normalized.phone,
      shift_time: normalized.shift_time || null
    },
    payroll,
    attendance_summary: {
      present_days: presentDays,
      late_days: lateDays,
      absent_days: absentDays,
      worked_minutes: payroll.worked_minutes,
      late_minutes: payroll.total_late_minutes,
      paid_leave_minutes: payroll.paid_leave_minutes,
      festival_minutes: payroll.festival_minutes,
      payable_minutes: payroll.payable_minutes
    },
    attendance_rows: attendanceRows,
    incentives,
    advances,
    fines,
    notes: notes.map((n) => ({
      note_id: n.note_id,
      type: n.type,
      content: n.content,
      created_at: n.created_at
    }))
  };
};

const updateEmployeeSalaries = async (updates, admin_id) => {
  const validUpdates = updates.filter(
    (u) => u.employee_id && typeof u.salary === 'number'
  );

  if (validUpdates.length === 0) {
    throw new Error('No valid salary updates found');
  }

  const userBulkOps = [];
  const adminBulkOps = [];

  for (const u of validUpdates) {
    userBulkOps.push({
      updateOne: {
        filter: {
          userId: u.employee_id,
          ...buildActiveEmployeeFilter()
        },
        update: {
          $set: {
            salary: u.salary,
            updatedOn: new Date(),
            updated_by: admin_id || null
          }
        }
      }
    });

    adminBulkOps.push({
      updateOne: {
        filter: {
          adminId: u.employee_id,
          role: { $regex: '^operator$', $options: 'i' }
        },
        update: {
          $set: {
            salary: u.salary,
            updatedOn: new Date(),
            updated_by: admin_id || null
          }
        }
      }
    });
  }

  const [userResult, adminResult] = await Promise.all([
    User.bulkWrite(userBulkOps, { ordered: false }),
    Admin.bulkWrite(adminBulkOps, { ordered: false }).catch(() => ({
      matchedCount: 0,
      modifiedCount: 0
    }))
  ]);

  return {
    matched: userResult.matchedCount + adminResult.matchedCount,
    modified: userResult.modifiedCount + adminResult.modifiedCount
  };
};

const formatActivityMessage = (
  actionType,
  metadata,
  operatorName,
  employeeName,
  viewMode = 'employee'
) => {
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

const getAdminActivity = async (branch_id, limit = 50) => {
  const ActivityLog = mongoose.model('activity_log');

  const logs = await ActivityLog.find({})
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();

  const userIds = [
    ...new Set(
      [...logs.map((l) => l.operator_id), ...logs.map((l) => l.target_employee_id)].filter(
        Boolean
      )
    )
  ];

  const userMap = await resolvePersonNames(userIds);

  return logs.map((log) => ({
    log_id: log.log_id,
    action_type: log.action_type,
    operator: userMap[log.operator_id] || 'System',
    target_employee: userMap[log.target_employee_id] || null,
    metadata: log.metadata,
    created_at: log.created_at,
    message: formatActivityMessage(
      log.action_type,
      log.metadata,
      userMap[log.operator_id],
      userMap[log.target_employee_id],
      'admin'
    )
  }));
};

const getAttendanceList = async (employee_id, month, year) => {
  const start = moment(`${year}-${month}-01`).startOf('month');
  const end = moment(`${year}-${month}-01`).endOf('month');

  const today = moment().endOf('day');

  const rangeEnd = end.isAfter(today) ? today : end;

  const records = await Attendance.find({
    employee_id,
    attendance_date: {
      $gte: start.format('YYYY-MM-DD'),
      $lte: end.format('YYYY-MM-DD')
    }
  }).lean();

  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.attendance_date] = r;
  });

  const result = [];
  let current = moment(start);

  while (current.isSameOrBefore(rangeEnd, 'day')) {
    const dateStr = current.format('YYYY-MM-DD');
    const existing = recordMap[dateStr];

    if (existing) {
      const sessions = (existing.sessions || []).map((s) => ({
        punch_in: s.punch_in || null,
        punch_out: s.punch_out || null,
        duration: s.duration || 0,
        punch_in_photo: s.punch_in_photo || null,
        punch_out_photo: s.punch_out_photo || null
      }));

      result.push({
        date: existing.attendance_date,
        total_hours: existing.total_hours,
        status: existing.status,
        late_minutes: existing.late_minutes,
        deduction: existing.deduction_amount,
        is_active: existing.is_active,
        sessions
      });
    } else {
      result.push({
        date: dateStr,
        total_hours: 0,
        status: 'ABSENT',
        late_minutes: 0,
        deduction: 0,
        is_active: false,
        sessions: []
      });
    }

    current.add(1, 'day');
  }

  return result.sort((a, b) => (a.date < b.date ? 1 : -1));
};

const getFineList = async (month, employee_id) => {
  const query = {};
  if (month) query.month = month;
  if (employee_id) query.employee_id = employee_id;
  return Fine.find(query).sort({ created_at: -1 });
};

const saveFine = async (data) => {
  const { employee_id, amount, reason, month, added_by } = data;

  const employee = await findPersonById(employee_id);
  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!amount || amount <= 0) {
    throw new Error('Invalid fine amount');
  }

  const fineMonth = month || moment().format('YYYY-MM');

  const fine = new Fine({
    fine_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    amount,
    reason: reason || '',
    fine_date: moment().format('YYYY-MM-DD'),
    added_by: added_by || 'admin',
    operator_id: added_by || '',
    month: fineMonth,
    apply_to: 'CURRENT',
    salary_processed: false
  });

  await globalActivity({
    operator_id: 'admin',
    action_type: 'FINE',
    target_employee_id: employee_id,
    branch_id: employee.branch_id || '',
    metadata: { amount, reason, month: fineMonth }
  });

  await fine.save();
  return fine;
};

const getEmployeeNotes = async (employee_id) => {
  return EmployeeNote.find({ employee_id }).sort({ created_at: -1 });
};

const saveEmployeeNote = async (data) => {
  const { employee_id, type, content, created_by } = data;

  const note = new EmployeeNote({
    note_id: new mongoose.Types.ObjectId().toString(),
    employee_id,
    type: type || 'GENERAL',
    content,
    created_by: created_by || ''
  });

  await note.save();
  return note;
};

const updateEmployeeNote = async (note_id, data) => {
  const note = await EmployeeNote.findOneAndUpdate(
    { note_id },
    {
      type: data.type,
      content: data.content,
      updated_at: new Date()
    },
    { new: true }
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return note;
};

const deleteEmployeeNote = async (note_id) => {
  const note = await EmployeeNote.findOneAndDelete({ note_id });
  if (!note) {
    throw new Error('Note not found');
  }
  return note;
};

module.exports = {
  getAdminDashboard,
  createEmployee,
  adminOverwriteAttendance,
  saveIncentive,
  getIncentiveList,
  removeIncentive,
  saveAdvance,
  getAdvanceList,
  removeAdvance,
  updateEmployeeSalaries,
  getEmployeeList,
  getAdminActivity,
  savePayrollAdjustment,
  getEmployeePayrollPreview,
  generateEmployeePayroll,
  getPayrollEmployees,
  lockEmployeePayroll,
  markEmployeePayrollPaid,
  getEmployeePayroll,
  getEmployeePayrollSlip,
  getAttendanceList,
  getFineList,
  saveFine,
  getEmployeeNotes,
  saveEmployeeNote,
  updateEmployeeNote,
  deleteEmployeeNote,
  normalizeEmployeeForFrontend
};
