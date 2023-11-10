"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const ensureAuthenticate_1 = require("../modules/registrations/middleware/ensureAuthenticate");
const admins_routes_1 = require("./admins.routes");
const donations_routes_1 = require("./donations.routes");
const refreshToken_routes_1 = require("./refreshToken.routes");
const schoolClass_routes_1 = require("./schoolClass.routes");
const students_routes_1 = require("./students.routes");
const webhooks_1 = require("./webhooks");
const router = (0, express_1.Router)();
exports.router = router;
//donations routes
router.use('/donates', donations_routes_1.donationsRoutes);
// students routes
router.use('/students', students_routes_1.studentsRoutes);
//regristrations routes
router.use('/admins', admins_routes_1.adminsRoutes);
router.use('/refresh-token', refreshToken_routes_1.refreshTokenRoutes);
router.get('/logintest', ensureAuthenticate_1.ensureAuthenticated, (req, res) => {
    return res.json({ success: true });
});
router.use('/schoolClass', schoolClass_routes_1.schoolClassRoutes);
router.use('/webhooks', webhooks_1.webhooksRoutes);
