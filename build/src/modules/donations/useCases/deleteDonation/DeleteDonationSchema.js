"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationSchema = void 0;
const yup_1 = require("yup");
const donationSchema = (0, yup_1.object)({
    donationID: (0, yup_1.string)().required("O id da doação é obrigatório")
});
exports.donationSchema = donationSchema;
