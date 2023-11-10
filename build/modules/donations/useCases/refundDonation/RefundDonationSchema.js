"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundDonationSchema = void 0;
const yup_1 = require("yup");
const refundDonationSchema = (0, yup_1.object)({
    donationID: (0, yup_1.string)().required("ID da doação não informado."),
    chargeID: (0, yup_1.string)().required("ID da cobrança não informado.")
});
exports.refundDonationSchema = refundDonationSchema;
