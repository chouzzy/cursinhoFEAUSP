"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importStar(require("express"));
const ensureAuthenticate_1 = require("../modules/registrations/middleware/ensureAuthenticate");
const admins_routes_1 = require("./admins.routes");
const donations_routes_1 = require("./donations.routes");
const refreshToken_routes_1 = require("./refreshToken.routes");
const schoolClass_routes_1 = require("./schoolClass.routes");
const students_routes_1 = require("./students.routes");
const webhooks_1 = require("./webhooks");
const welcome_routes_1 = require("./welcome.routes");
const efiwebhook_1 = require("./efiwebhook");
const router = (0, express_1.Router)();
exports.router = router;
router.use('/webhooks', webhooks_1.webhooksRoutes);
router.use(express_1.default.json({ type: "application/json" }));
//welcome routes
router.use('/', welcome_routes_1.welcomeRoutes);
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
router.use('/webhook-efi', efiwebhook_1.webhookEfiRoutes);
