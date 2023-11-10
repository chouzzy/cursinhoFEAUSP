"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStudentsSchema = void 0;
const yup_1 = require("yup");
const listStudentsSchema = (0, yup_1.object)({
    id: (0, yup_1.string)(),
    email: (0, yup_1.string)().min(3, "O email precisa ter no mínimo três letras"),
    state: (0, yup_1.string)().min(3, "O estado precisa ter no mínimo três letras"),
    initDate: (0, yup_1.string)().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
        .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    endDate: (0, yup_1.string)().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
        .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    page: (0, yup_1.string)(),
    paymentStatus: (0, yup_1.string)().oneOf(["active", "canceled", "refunded"]).nullable()
});
exports.listStudentsSchema = listStudentsSchema;
