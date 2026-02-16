const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/course.controller");

router.post("/", asyncHandler(c.createCourse));
router.get("/", asyncHandler(c.getAllCourses));
router.get("/:id", asyncHandler(c.getCourseById));
router.put("/:id", asyncHandler(c.updateCourse));
router.delete("/:id", asyncHandler(c.deleteCourse));

module.exports = router;