"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationSchema = void 0;
const yup_1 = require("yup");
const donationSchema = (0, yup_1.object)({
    name: (0, yup_1.string)().required("O nome é obrigatório").min(2, "O nome precisa ter no mínimo duas letras"),
    email: (0, yup_1.string)().required("O email é obrigatório").min(3, "O email precisa ter no mínimo três letras"),
    phoneNumber: (0, yup_1.string)().required("O nome é obrigatório").min(10, "O número precisa ter ao mínimo 10 letras, contando DDD"),
    gender: (0, yup_1.string)(),
    birth: (0, yup_1.string)().required("A date de nascimento é obrigatória").min(10, "A date de nascimento precisa estar no formato XX/XX/XXXX"),
    isPhoneWhatsapp: (0, yup_1.boolean)().required("Informe se o telefone também é Whatsapp"),
    state: (0, yup_1.string)().required("O estado é obrigatório").min(2, "O estado deve possuir ao menos 2 letras"),
    city: (0, yup_1.string)().required("A cidade é obrigatória").min(2, "A cidade deve possuir ao menos 2 letras"),
    street: (0, yup_1.string)().required("A rua é obrigatória"),
    homeNumber: (0, yup_1.string)().required("Número da residência obrigatório"),
    complement: (0, yup_1.string)(),
    district: (0, yup_1.string)().required("O bairro é obrigatório"),
    zipCode: (0, yup_1.string)().required("O CEP é obrigatório").min(9, "O CEP deve conter 8 algarismos e um hífen. Ex: 08230-030"),
    cpf: (0, yup_1.string)().test('cpf-validation', 'O CPF deve conter ao menos 11 caracteres ou "Não informado"', (value) => {
        // Check if the value is either "Não informado" or a string with length 11
        return value === "Não informado" || (typeof value === "string" && value.length === 11);
    }),
    rg: (0, yup_1.string)().min(9, "O RG deve conter ao menos 9 caracteres").max(9, "O RG deve conter ao menos 9 caracteres"),
    valuePaid: (0, yup_1.number)().required(),
    cnpj: (0, yup_1.string)().min(14, "O CNPJ deve conter 14 caracteres").max(14, "O CNPJ deve conter 14 caracteres"),
});
exports.donationSchema = donationSchema;
