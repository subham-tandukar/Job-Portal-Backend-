const express = require("express");
const router = new express.Router();

const adminUserControllers = require("../controllers/adminUserController");
const loginControllers = require("../controllers/loginController");
const jobControllers = require("../controllers/jobController");
const categoryControllers = require("../controllers/categoryController");
const jobTypeControllers = require("../controllers/jobTypeController");
const countControllers = require("../controllers/countController");
const blogControllers = require("../controllers/blogController");
const pageControllers = require("../controllers/pageController");
const { verifyToken } = require("../utils/VerifyAdminUsers.js");

// ==============================
router.post("/api/admin/login", loginControllers.login);
router.get("/api/admin/signOut", loginControllers.signOut);
router.post("/api/admin/google", loginControllers.google);
router.post("/api/admin/user", adminUserControllers.user);
router.get("/api/admin/getUser", adminUserControllers.getUser);

router.post("/api/admin/job", jobControllers.job);
router.get("/api/jobList", jobControllers.jobList);
router.get("/api/jobList/:slug", jobControllers.singleJob);
router.get("/api/relatedJob/:slug", jobControllers.relatedJob);
router.get("/api/featuredJob", jobControllers.featuredJob);
router.get("/api/internJob", jobControllers.internJob);

router.post("/api/admin/blog", blogControllers.blog);
router.get("/api/blogList", blogControllers.blogList);
router.get("/api/blogList/:slug", blogControllers.singleBlog);

router.post("/api/admin/category", categoryControllers.category);
router.get("/api/categoryList", categoryControllers.categoryList);

router.post("/api/admin/jobType", jobTypeControllers.jobType);
router.get("/api/jobTypeList", jobTypeControllers.jobTypeList);

router.post("/api/admin/page", pageControllers.page);
router.get("/api/pageList", pageControllers.pageList);
router.get("/api/pageList/:slug", pageControllers.singlePage);

router.get("/api/location-count", countControllers.locationCount);

// -------------------------------

module.exports = router;
