import * as yup from "yup";
import YupPassword from 'yup-password'
YupPassword(yup)

const createSchoolClassStagesSchema = yup.array(yup.object({
    when: yup.string().required("when required"),
    resultsDate: yup.date().required("resultsDate required"),
    description: yup.string().required("description required"),
}))
export { createSchoolClassStagesSchema }