import { array, number, object, string } from "yup";

const studentSchema = object({
    name: string().required("O nome é obrigatório").min(2, "O nome precisa ter no mínimo duas letras"),
    email: string().required("O email é obrigatório").min(3, "O email precisa ter no mínimo três letras"),
    phoneNumber: string().required("O nome é obrigatório").min(10, "O número precisa ter ao mínimo 10 letras, contando DDD"),
    gender: string(),
    birth: string().required("A date de nascimento é obrigatória").min(10, "A date de nascimento precisa estar no formato XX/XX/XXXX"),
    country: string().required("O país é obrigatório").min(4, "O nome do país deve ter ao menos 4 letras"),
    state: string().required("O estado é obrigatório").min(2, "O estado deve possuir ao menos 2 letras"),
    city: string().required("A cidade é obrigatória").min(2, "A cidade deve possuir ao menos 2 letras"),
    address: string().required("O CEP é obrigatório").min(9, "O CEP deve conter 8 algarismos e um hífen. Ex: 08230-030"),
    cpf: string().required().min(11, "O CPF deve conter 11 caracteres").max(11, "O CPF deve conter 11 caracteres"),
    rg: string().required().min(9, "O RG deve conter 9 caracteres").max(9, "O RG deve conter 9 caracteres"),
    selfDeclaration: string(),
    oldSchool: string(),
    oldSchoolAdress: string(),
    highSchoolGraduationDate: string(),
    highSchoolPeriod: string(),
    metUsMethod: string(),
    exStudent: string().required(),
    purcharsedSubscriptions: array().of(object({
        schoolClassID: string().required("O ID da turma deve ser informado").min(36, "O ID deve possuir 36 caracteres no formato UUID")
    }))
})

export { studentSchema }