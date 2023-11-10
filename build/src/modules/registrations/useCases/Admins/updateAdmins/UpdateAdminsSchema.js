"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSchema = void 0;
const yup_1 = require("yup");
const updateAdminSchema = (0, yup_1.object)({
    name: (0, yup_1.string)().required("O nome é obrigatório").min(2, "O nome precisa ter no mínimo dois caracteres"),
    email: (0, yup_1.string)().min(3, "O email precisa ter no mínimo três caracteres"),
    username: (0, yup_1.string)().required("O username é obrigatório").min(3, "O username precisa conter no mínimo 3 caracteres"),
});
exports.updateAdminSchema = updateAdminSchema;
