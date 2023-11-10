import * as yup from "yup";
import YupPassword from 'yup-password'
YupPassword(yup)

const createSchoolClassDocsSchema = yup.object({
    title: yup.string().min(3, 'O título deve conter ao menos 3 caracteres'),
    downloadLink: yup.string().min(3, 'O título deve conter ao menos 3 caracteres')
})
export { createSchoolClassDocsSchema }