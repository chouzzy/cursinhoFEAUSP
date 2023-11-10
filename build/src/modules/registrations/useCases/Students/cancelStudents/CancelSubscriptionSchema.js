"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDonationSchema = void 0;
const yup_1 = require("yup");
const deleteDonationSchema = (0, yup_1.object)({
    studentID: (0, yup_1.string)().required("O id da inscrição é obrigatório").length(36),
    stripeSubscriptionID: (0, yup_1.string)().required("O id da turma é obrigatório")
});
exports.deleteDonationSchema = deleteDonationSchema;
