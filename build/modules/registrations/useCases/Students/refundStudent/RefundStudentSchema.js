"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundStudentSchema = void 0;
const yup_1 = require("yup");
const refundStudentSchema = (0, yup_1.object)({
    studentID: (0, yup_1.string)().required("ID da inscrição não informado."),
    chargeID: (0, yup_1.string)().required("ID da cobrança não informado.")
});
exports.refundStudentSchema = refundStudentSchema;
