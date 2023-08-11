import { number, object, string } from "yup";

const listDonationSchema = object({

    initValue: number().min(0, "O nome precisa ter no mínimo duas letras"),
    endValue: number().min(0, "O email precisa ter no mínimo três letras"),
    email: string().min(3, "O email precisa ter no mínimo três letras"),
    initDate: string().min(10, "A data deve estar no formato americano YYYY-DD-MM com os hífens")
    .max(10, 'A data deve estar no formato americano YYYY-DD-MM com os hífens'),
    endDate: string().min(10, "A data deve estar no formato americano YYYY-DD-MM com os hífens")
    .max(10, 'A data deve estar no formato americano YYYY-DD-MM com os hífens'),
    page: number(),
    pageRange: number()
})

export {listDonationSchema}