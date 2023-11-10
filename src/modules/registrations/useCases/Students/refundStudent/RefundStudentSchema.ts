import { object, string } from "yup";
const refundStudentSchema = object({
  studentID: string().required("ID da inscrição não informado."),
  chargeID: string().required("ID da cobrança não informado.")
})

export { refundStudentSchema }