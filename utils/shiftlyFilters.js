/**
 * Restaurant User docs historically have empty/missing role.
 * Shiftly-created employees set role: 'employee'.
 * Treat both as Shiftly employees; never treat admin role as employee.
 */
const buildActiveEmployeeFilter = (branch_id = '') => {
  const filter = {
    status: 'Active',
    $or: [
      { role: { $regex: '^employee$', $options: 'i' } },
      { role: '' },
      { role: null },
      { role: { $exists: false } }
    ]
  };

  if (branch_id) {
    filter.branch_id = branch_id;
  }

  return filter;
};

const buildActiveOperatorFilter = (branch_id = '') => {
  const filter = {
    role: { $regex: '^operator$', $options: 'i' }
  };

  // Only apply status when set (legacy Admin docs may omit status)
  // Prefer Active when present, but still include docs without status
  filter.$or = [
    { status: 'Active' },
    { status: '' },
    { status: null },
    { status: { $exists: false } }
  ];

  if (branch_id) {
    filter.branch_id = branch_id;
  }

  return filter;
};

module.exports = {
  buildActiveEmployeeFilter,
  buildActiveOperatorFilter
};
