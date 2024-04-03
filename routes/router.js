const express = require("express");
const router = new express.Router();

const adminUserControllers = require("../controllers/adminUserController");
const loginControllers = require("../controllers/loginController");
const jobControllers = require("../controllers/jobController");
const categoryControllers = require("../controllers/categoryController");
const countControllers = require("../controllers/countController");

// ==============================
router.post("/api/admin/login", loginControllers.login);
router.post("/api/admin/user", adminUserControllers.user);
router.get("/api/admin/getUser", adminUserControllers.getUser);
router.post("/api/admin/job", jobControllers.job);
router.get("/api/jobList", jobControllers.jobList);
router.get("/api/featuredJob", jobControllers.featuredJob);
router.post("/api/admin/category", categoryControllers.category);
router.get("/api/admin/categoryList", categoryControllers.categoryList);
router.get("/api/getCategory", categoryControllers.getCategory);
router.get("/api/location-count", countControllers.locationCount);

// -------------------------------

module.exports = router;
