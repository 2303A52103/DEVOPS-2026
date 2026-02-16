const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const c = require("../controllers/enrollment.controller");

router.post("/", asyncHandler(c.createEnrollment));
router.get("/", asyncHandler(c.getAllEnrollments));
router.get("/:id", asyncHandler(c.getEnrollmentById));
router.put("/:id", asyncHandler(c.updateEnrollment));
router.delete("/:id", asyncHandler(c.deleteEnrollment));

module.exports = router;