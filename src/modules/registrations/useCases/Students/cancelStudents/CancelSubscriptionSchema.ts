import { number, object, string } from "yup";

const deleteDonationSchema = object({
    studentID: string().required("O id da inscrição é obrigatório").length(36),
    stripeSubscriptionID: string().required("O id da turma é obrigatório")
})

export {deleteDonationSchema}