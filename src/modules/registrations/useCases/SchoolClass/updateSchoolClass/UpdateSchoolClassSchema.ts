import * as yup from "yup" ;

const updateSchoolClassSchema = yup.object({

    title: yup.string().min(3, "O título precisa ter no mínimo três caracteres"),
    status: yup.string().oneOf(['active', 'inactive'], "O status deve ser um dos seguintes valores: 'active' ou 'inactive' "),

    informations: yup.object({
        description:  yup.string(),
        whoCanParticipate:  yup.string(),
        observations:  yup.string(),
        classContent:  yup.string(),
        dateSchedule:  yup.string(),
        hourSchedule:  yup.string(),
        color:  yup.string(),
    }),

    subscriptions: yup.object({
        status: yup.string(),
        price: yup.number(),
        subscriptionSchedule: yup.string(),
    }),

    selectiveStages: yup.array().of(
        yup.object().shape({
            when: yup.string(),
            resultsDate: yup.date().nullable().typeError("resultsDate must be a valid date"),
            description: yup.string(),
        })
    ),

    documents: yup.array().of(
        yup.object().shape({
            title: yup.string().min(3, 'O título deve conter ao menos 3 caracteres'),
            downloadLink: yup.string().min(3, 'O título deve conter ao menos 3 caracteres')
        })
    )
})

export { updateSchoolClassSchema }