const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/register", upload.array("documents", 5), register);
router.post("/login", login);

module.exports = router;
