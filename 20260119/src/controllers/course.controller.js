const { Course, Enrollment } = require("../models");

exports.createCourse = async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
};

exports.getAllCourses = async (req, res) => {
  const courses = await Course.findAll({ order: [["createdAt", "DESC"]] });
  res.json(courses);
};

exports.getCourseById = async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    include: [Enrollment],
  });
  if (!course) {
    const e = new Error("Course not found");
    e.statusCode = 404;
    throw e;
  }
  res.json(course);
};

exports.updateCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) {
    const e = new Error("Course not found");
    e.statusCode = 404;
    throw e;
  }
  await course.update(req.body);
  res.json(course);
};

exports.deleteCourse = async (req, res) => {
  const deleted = await Course.destroy({ where: { id: req.params.id } });
  if (!deleted) {
    const e = new Error("Course not found");
    e.statusCode = 404;
    throw e;
  }
  res.json({ message: "Course deleted" });
};