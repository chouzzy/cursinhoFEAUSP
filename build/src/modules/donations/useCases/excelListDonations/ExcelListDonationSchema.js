"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDonationSchema = void 0;
const yup_1 = require("yup");
const listDonationSchema = (0, yup_1.object)({
    initValue: (0, yup_1.number)().min(0, "O nome precisa ter no mínimo duas letras"),
    endValue: (0, yup_1.number)().min(0, "O email precisa ter no mínimo três letras"),
    email: (0, yup_1.string)().min(3, "O email precisa ter no mínimo três letras"),
    initDate: (0, yup_1.string)().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
        .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    endDate: (0, yup_1.string)().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
        .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    page: (0, yup_1.number)(),
    pageRange: (0, yup_1.number)()
});
exports.listDonationSchema = listDonationSchema;
