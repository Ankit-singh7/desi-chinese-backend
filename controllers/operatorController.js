const operatorService = require('../service/operator.service');
const { uploadPunchPhoto } = require('../service/google-drive.service');

exports.getDashboard = async (req, res) => {
    try {
        const { operatorId } = req.params;

        const data = await operatorService.getOperatorDashboard(operatorId);

        res.status(200).send({
            error: false,
            message: 'Operator dashboard fetched successfully',
            data
        });

    } catch (err) {
        res.status(500).send({
            error: true,
            message: err.message || 'Something went wrong'
        });
    }
};

exports.getEmployeeList = async (req, res) => {
    try {
        const data = await operatorService.getEmployeeListWithStatus();

        res.status(200).send({
            error: false,
            message: 'Employee list fetched',
            data
        });

    } catch (err) {
        res.status(500).send({
            error: true,
            message: err.message
        });
    }
};

exports.operatorPunch = async (req, res) => {
  try {

    const {
      employee_id,
      operator_id
    } = req.body;

    if (!employee_id || !operator_id) {
      return res.status(400).send({
        error: true,
        message: 'employee_id and operator_id are required'
      });
    }

    let photoUrl = null;

    if (req.file) {
      photoUrl = await uploadPunchPhoto(
        req.file.buffer,
        employee_id,
        'PUNCH'
      );
    }

    const data = await operatorService.operatorPunch(
      employee_id,
      operator_id,
      photoUrl
    );

    res.status(200).send({
      error: false,
      message: data.message,
      data
    });

  } catch (err) {

    res.status(500).send({
      error: true,
      message: err.message
    });

  }
};

exports.punch = async (req, res) => {
  try {
    const { employee_id, branch_id } = req.body;
    const photoBuffer = req.file ? req.file.buffer : null;

    const result = await operatorService.punch(
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
          operatorService.attachPunchPhoto(
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

exports.changeShift = async (req, res) => {
  try {

    const { employee_id, new_shift, operator_id, shift_time } = req.body;

    if (!employee_id || !new_shift || !operator_id) {
      return res.status(400).send({
        error: true,
        message: 'Missing required fields'
      });
    }

    const data = await operatorService.changeShift(
      employee_id,
      new_shift,
      shift_time,
      operator_id
    );

    res.status(200).send({
      error: false,
      message: data.message,
      data
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.changeBranch = async (req, res) => {
  try {

    const { employee_id, new_branch_id, operator_id } = req.body;

    if (!employee_id || !new_branch_id || !operator_id) {
      return res.status(400).send({
        error: true,
        message: 'Missing required fields'
      });
    }

    const data = await operatorService.changeBranch(
      employee_id,
      new_branch_id,
      operator_id
    );

    res.status(200).send({
      error: false,
      message: data.message,
      data
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.addFine = async (req, res) => {
  try {

    const { employee_id, amount, reason, operator_id } = req.body;

    if (!employee_id || !amount || !operator_id) {
      return res.status(400).send({
        error: true,
        message: 'Missing required fields'
      });
    }

    const data = await operatorService.addFine(
      employee_id,
      amount,
      reason,
      operator_id
    );

    res.status(200).send({
      error: false,
      message: data.message,
      data
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {

    const operator_id = req.params.operatorId;

    const data = await operatorService.getRecentActivity(operator_id);

    res.status(200).send({
      error: false,
      data
    });

  } catch (err) {
    res.status(500).send({
      error: true,
      message: err.message
    });
  }
};


exports.getAttendanceControl = async (req, res) => {
  try {

    const branch_id = req.query.branch_id || null;

    const data = await operatorService.getAttendanceControl(branch_id);

    res.status(200).send({
      error: false,
      message: 'Attendance control fetched successfully',
      data
    });

  } catch (err) {

    console.error('Attendance Control Error:', err);

    res.status(500).send({
      error: true,
      message: err.message || 'Internal Server Error'
    });
  }
};

exports.getProfile = async (req, res) => {
    try {

        const operatorId = req.params.operatorId;

        const data = await operatorService.getOperatorProfile(operatorId);

        res.status(200).send({
            error: false,
            message: 'Operator profile fetched successfully',
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: true,
            message: err.message || 'Failed to fetch profile'
        });
    }
};

exports.addAdvance = async (req, res) => {
  try {

    const {
      employee_id,
      branch_id,
      amount,
      reason,
      month,
      added_by
    } = req.body;

    if (
      !employee_id ||
      !amount ||
      !month ||
      !added_by
    ) {
      return res.status(400).send({
        error: true,
        message: 'Missing required fields'
      });
    }

    const data = await operatorService.addAdvance({
      employee_id,
      branch_id,
      amount: Number(amount),
      reason,
      month,
      added_by
    });

    res.status(200).send({
      error: false,
      message: 'Advance added successfully',
      data
    });

  } catch (err) {

    console.error(err);

    res.status(500).send({
      error: true,
      message: err.message || 'Failed to add advance'
    });
  }
};
