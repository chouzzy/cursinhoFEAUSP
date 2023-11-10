"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminsSchema = void 0;
const yup_1 = require("yup");
const listAdminsSchema = (0, yup_1.object)({
    id: (0, yup_1.string)(),
    name: (0, yup_1.string)(),
    email: (0, yup_1.string)(),
    username: (0, yup_1.string)(),
    password: (0, yup_1.string)(),
    page: (0, yup_1.string)()
});
exports.listAdminsSchema = listAdminsSchema;
