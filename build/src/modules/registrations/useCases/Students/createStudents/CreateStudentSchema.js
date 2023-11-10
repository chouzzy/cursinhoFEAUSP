"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentSchema = void 0;
const yup_1 = require("yup");
const studentSchema = (0, yup_1.object)({
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
    cpf: (0, yup_1.string)().required().min(11, "O CPF deve conter 11 caracteres").max(11, "O CPF deve conter 11 caracteres"),
    rg: (0, yup_1.string)().min(9, "O RG deve conter 9 caracteres").max(9, "O RG deve conter 9 caracteres"),
    ufrg: (0, yup_1.string)().required("O estado de emissão do RG é obrigatório.").oneOf([
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
        'Não informado'
    ]),
    selfDeclaration: (0, yup_1.string)(),
    oldSchool: (0, yup_1.string)(),
    oldSchoolAdress: (0, yup_1.string)(),
    highSchoolGraduationDate: (0, yup_1.string)(),
    highSchoolPeriod: (0, yup_1.string)(),
    metUsMethod: (0, yup_1.string)(),
    exStudent: (0, yup_1.string)().required(),
    purcharsedSubscriptions: (0, yup_1.array)().of((0, yup_1.object)({
        schoolClassID: (0, yup_1.string)().required("O ID da turma deve ser informado").min(36, "O ID deve possuir 36 caracteres no formato UUID")
    })).required('É necessário comprar ao menos uma inscrição para prosseguir')
});
exports.studentSchema = studentSchema;