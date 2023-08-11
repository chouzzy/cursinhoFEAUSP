import * as yup from "yup" ;
import YupPassword from 'yup-password'
YupPassword(yup)

const createSchoolClassSchema = yup.object({
    title: yup.string().required("O título é obrigatório").min(3, "O título precisa ter no mínimo três caracteres"),
    status: yup.string().oneOf(['active', 'inactive'], "O status deve ser um dos seguintes valores: 'active' ou 'inactive' ").required("O status é obrigatório"),

    informations: yup.object({
        description:  yup.string().required("description required"),
        whoCanParticipate:  yup.string().required("whoCanParticipate required"),
        observations:  yup.string(),
        classContent:  yup.string().required("classContent required"),
        dateSchedule:  yup.string().required("dateSchedule required"),
        hourSchedule:  yup.string().required("hourSchedule required"),
        color:  yup.string().required("color required"),
    }).required("As informações do curso são obrigatórias"),

    subscriptions: yup.object({
        status: yup.string().required("status required"),
        price: yup.number().required("price required"),
        subscriptionSchedule: yup.string().required("subscriptionSchedule required"),
    }).required("subscriptions required"),

    selectiveStages: yup.array().of(
        yup.object().shape({
            when: yup.string().required("when required"),
            resultsDate: yup.date().nullable().required("resultsDate required"),
            description: yup.string().required("description required"),
        })
    ).required("selectiveStages required"),

    documents: yup.array().of(
        yup.object().shape({
            title: yup.string().min(3, 'O título deve conter ao menos 3 caracteres'),
            downloadLink: yup.string().min(3, 'O título deve conter ao menos 3 caracteres')
        })
    )
})

export { createSchoolClassSchema }