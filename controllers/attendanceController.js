const attendanceService = require('../service/attendance.service');
const { uploadPunchPhoto } = require('../service/google-drive.service');
const adminService = require('../service/admin.service');

exports.punch = async (req, res) => {
  try {
    const { employee_id, branch_id } = req.body;
    const photoBuffer = req.file ? req.file.buffer : null;

    const result = await attendanceService.punch(
      employee_id,
      branch_id,
      null
    );

    res.status(200).send({
      error: false,
      message: result.message,
      data: result
    });

    if (photoBuffer) {
      uploadPunchPhoto(photoBuffer, employee_id, 'PUNCH')
        .then((photoUrl) => {
          attendanceService.attachPunchPhoto(
            employee_id,
            result.type,
            photoUrl
          ).catch(err => {
            console.error('Failed to attach photo URL:', err.message);
          });
        })
        .catch(err => {
          console.error('Drive upload failed:', err.message);
        });
    }

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message || 'Something went wrong'
    });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await attendanceService.getDashboard(employeeId);

    res.status(200).send({
      error: false,
      data: result
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.getAttendanceList = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const result = await attendanceService.getAttendanceList(
      employeeId,
      month,
      year
    );

    res.status(200).send({
      error: false,
      data: result
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};


exports.getBranchesWithLocation = async (req, res) => {
  try {
    const result = await attendanceService.getBranchesWithLocation();

    res.status(200).send({
      error: false,
      data: result
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.getEmployeePayroll = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const result = await attendanceService.getEmployeePayrollList(employee_id);

    res.status(200).send({
      error: false,
      message: 'Payroll fetched',
      data: result
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.getEmployeePayrollSlip = async (req, res) => {
  try {
    const { employee_id, month } = req.query;

    const data = await adminService.getEmployeePayrollSlip(
      employee_id,
      month
    );

    res.send({
      error: false,
      message: 'Salary slip fetched',
      data
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.getEmployeeActivity = async (req, res) => {
  try {
    const result = await attendanceService.getEmployeeActivity(
      req.params.employeeId, 20
    );
    res.status(200).send({ error: false, message: 'Activity fetched', data: result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};
