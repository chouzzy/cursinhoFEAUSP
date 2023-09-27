import { object, string } from "yup";

const listStudentsSchema = object({

    id: string(),
    email: string().min(3, "O email precisa ter no mínimo três letras"),
    state: string().min(3, "O estado precisa ter no mínimo três letras"),
    paymentStatus: string(),
    initDate: string().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
    .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    endDate: string().min(10, "A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens")
    .max(10, 'A data deve estar no formato ISO 8601 YYYY-MM-DD com os hífens'),
    page: string()
})

export {listStudentsSchema}