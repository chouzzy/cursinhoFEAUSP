import { boolean, number, object, string } from "yup";

const listChargesStudentSchema = object({
  studentID: string().required("ID da inscrição não informado.")
})

export { listChargesStudentSchema }