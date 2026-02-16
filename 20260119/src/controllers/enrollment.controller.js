const { sequelize, Course, Enrollment } = require("../models");

exports.createEnrollment = async (req, res) => {
  const { courseId, studentEmail } = req.body;

  const result = await sequelize.transaction(async (t) => {
    // ensure course exists (consistency)
    const course = await Course.findByPk(courseId, { transaction: t });
    if (!course) {
      const e = new Error("Course not found for enrollment");
      e.statusCode = 404;
      throw e;
    }

    // create enrollment (unique constraint prevents duplicates)
    return await Enrollment.create({ courseId, studentEmail }, { transaction: t });
  });

  res.status(201).json(result);
};

exports.getAllEnrollments = async (req, res) => {
  const enrollments = await Enrollment.findAll({
    include: [Course],
    order: [["createdAt", "DESC"]],
  });
  res.json(enrollments);
};

exports.getEnrollmentById = async (req, res) => {
  const enrollment = await Enrollment.findByPk(req.params.id, {
    include: [Course],
  });
  if (!enrollment) {
    const e = new Error("Enrollment not found");
    e.statusCode = 404;
    throw e;
  }
  res.json(enrollment);
};

exports.updateEnrollment = async (req, res) => {
  const enrollment = await Enrollment.findByPk(req.params.id);
  if (!enrollment) {
    const e = new Error("Enrollment not found");
    e.statusCode = 404;
    throw e;
  }
  await enrollment.update(req.body); // progress update
  res.json(enrollment);
};

exports.deleteEnrollment = async (req, res) => {
  const deleted = await Enrollment.destroy({ where: { id: req.params.id } });
  if (!deleted) {
    const e = new Error("Enrollment not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ message: "Enrollment deleted" });
};