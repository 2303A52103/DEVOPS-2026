module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define(
    "Enrollment",
    {
      courseId: { type: DataTypes.INTEGER, allowNull: false },
      studentEmail: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { isEmail: { msg: "Invalid studentEmail" } },
      },
      enrolledAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Progress must be >= 0" },
          max: { args: [100], msg: "Progress must be <= 100" },
        },
      },
    },
    {
      tableName: "enrollments",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["courseId", "studentEmail"] }, // no duplicate enrollments
      ],
    }
  );

  return Enrollment;
};