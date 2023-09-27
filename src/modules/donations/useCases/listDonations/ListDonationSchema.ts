import { number, object, string } from "yup";

const listDonationSchema = object({

    initValue: number().min(0, "O nome precisa ter no mínimo duas letras"),
    endValue: number().min(0, "O email precisa ter no mínimo três letras"),
    email: string().min(3, "O email precisa ter no mínimo três letras"),
    initDate: string().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
    .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    endDate: string().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
    .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    page: number(),
    pageRange: number(),
    cpf: string().test('cpf-validation', 'O CPF deve conter ao menos 11 caracteres', (value) => {
        // Check if the value is either "Não informado" or a string with length 11
        return value === "Não informado" || (typeof value === "string" && value.length === 11);
      }),
    cnpj: string().min(14, "O CNPJ deve conter 14 caracteres").max(14, "O CNPJ deve conter 14 caracteres"),
})

export {listDonationSchema}