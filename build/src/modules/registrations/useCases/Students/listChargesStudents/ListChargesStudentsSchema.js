"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChargesStudentSchema = void 0;
const yup_1 = require("yup");
const listChargesStudentSchema = (0, yup_1.object)({
    studentID: (0, yup_1.string)().required("ID da inscrição não informado.")
});
exports.listChargesStudentSchema = listChargesStudentSchema;
