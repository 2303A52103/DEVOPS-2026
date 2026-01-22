const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Course = require("./course")(sequelize, DataTypes);
const Enrollment = require("./enrollment")(sequelize, DataTypes);

// 1-to-many
Course.hasMany(Enrollment, { foreignKey: "courseId", onDelete: "CASCADE" });
Enrollment.belongsTo(Course, { foreignKey: "courseId" });

module.exports = { sequelize, Course, Enrollment };