"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationsRoutes = void 0;
const express_1 = require("express");
const CreateDonationController_1 = require("../modules/donations/useCases/createDonation/CreateDonationController");
const DeleteDonationController_1 = require("../modules/donations/useCases/deleteDonation/DeleteDonationController");
const ListDonationsController_1 = require("../modules/donations/useCases/listDonations/ListDonationsController");
const UpdateDonationController_1 = require("../modules/donations/useCases/updateDonation/UpdateDonationController");
const ensureAuthenticate_1 = require("../modules/registrations/middleware/ensureAuthenticate");
const ExcelListDonationsController_1 = require("../modules/donations/useCases/excelListDonations/ExcelListDonationsController");
const RefundDonationController_1 = require("../modules/donations/useCases/refundDonation/RefundDonationController");
const ListChargesDonationController_1 = require("../modules/donations/useCases/listChargesDonation/ListChargesDonationController");
const SyncDonationsController_1 = require("../modules/donations/useCases/syncDonations/SyncDonationsController");
const donationsRoutes = (0, express_1.Router)();
exports.donationsRoutes = donationsRoutes;
const listDonationsController = new ListDonationsController_1.ListDonationsController();
donationsRoutes.get('/', ensureAuthenticate_1.ensureAuthenticated, listDonationsController.handle);
const excellistDonationsController = new ExcelListDonationsController_1.ExcelListDonationsController();
donationsRoutes.get('/excel', ensureAuthenticate_1.ensureAuthenticated, excellistDonationsController.handle);
const createDonationController = new CreateDonationController_1.CreateDonationController();
donationsRoutes.post('/create', createDonationController.handle);
const updateDonationController = new UpdateDonationController_1.UpdateDonationController();
donationsRoutes.put('/:donationID/update', ensureAuthenticate_1.ensureAuthenticated, updateDonationController.handle);
const deleteDonationController = new DeleteDonationController_1.DeleteDonationController();
donationsRoutes.put('/:donationID/cancel', ensureAuthenticate_1.ensureAuthenticated, deleteDonationController.handle);
const refundDonationController = new RefundDonationController_1.RefundDonationController();
donationsRoutes.post('/:donationID/:chargeID/refund', ensureAuthenticate_1.ensureAuthenticated, refundDonationController.handle);
const listChargesDonationController = new ListChargesDonationController_1.ListChargesDonationController();
donationsRoutes.get('/:donationID/list', ensureAuthenticate_1.ensureAuthenticated, listChargesDonationController.handle);
const syncDonationController = new SyncDonationsController_1.SyncDonationsController();
donationsRoutes.post('/sync', ensureAuthenticate_1.ensureAuthenticated, syncDonationController.handle);
