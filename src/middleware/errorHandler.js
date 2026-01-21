const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} = require("sequelize");

module.exports = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      message: "Duplicate enrollment (unique constraint hit)",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ message: "Invalid courseId (FK constraint)" });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};