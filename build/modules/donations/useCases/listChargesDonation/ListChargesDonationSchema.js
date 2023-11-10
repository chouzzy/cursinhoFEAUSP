"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChargesDonationSchema = void 0;
const yup_1 = require("yup");
const listChargesDonationSchema = (0, yup_1.object)({
    donationID: (0, yup_1.string)().required("ID da doação não informado.")
});
exports.listChargesDonationSchema = listChargesDonationSchema;
