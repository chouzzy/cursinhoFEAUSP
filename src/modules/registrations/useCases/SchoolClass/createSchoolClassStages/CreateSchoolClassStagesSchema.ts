import * as yup from "yup";
import YupPassword from 'yup-password'
YupPassword(yup)

const createSchoolClassStagesSchema = yup.array(yup.object({
    when: yup.string().required("when required"),
    resultsDate: yup.date().nullable().typeError("resultsDate must be a valid date"),
    description: yup.string().required("description required"),
}))
export { createSchoolClassStagesSchema }