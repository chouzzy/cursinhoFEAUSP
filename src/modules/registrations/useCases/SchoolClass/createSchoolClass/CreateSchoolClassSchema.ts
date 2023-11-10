import * as yup from "yup" ;
import YupPassword from 'yup-password'
YupPassword(yup)

const createSchoolClassSchema = yup.object({
    title: yup.string().required("O título é obrigatório").min(3, "O título precisa ter no mínimo três caracteres"),
    status: yup.string().oneOf(['active', 'inactive'], "O status deve ser um dos seguintes valores: 'active' ou 'inactive' ").required("O status é obrigatório"),

    informations: yup.object({
        description:  yup.string().required("Descrição obrigatória"),
        whoCanParticipate:  yup.string().required("É obrigatório colocar quem pode participar"),
        observations:  yup.string(),
        classContent:  yup.string().required("Conteúdo da turma obrigatório"),
        dateSchedule:  yup.string().required("Data obrigatória"),
        hourSchedule:  yup.string().required("Horário obrigatório"),
        color:  yup.string().required("Cor obrigatória"),
    }).required("As informações do curso são obrigatórias"),

    subscriptions: yup.object({
        status: yup.string().required("Status obrigatório"),
        price: yup.number().required("Preço obrigatório"),
        subscriptionSchedule: yup.string().required("Data de inscrição obrigatória"),
    }).required("Inscrição obrigatória"),

    selectiveStages: yup.array().of(
        yup.object().shape({    
            when: yup.string().required("when required"),
            resultsDate: yup.date().nullable().typeError("resultsDate must be a valid date"),
            description: yup.string().required("description required"),
        })
    ).required("selectiveStages required"),

    documents: yup.array().of(
        yup.object().shape({
            title: yup.string().min(3, 'O título deve conter ao menos 3 caracteres'),
            downloadLink: yup.string().min(3, 'O título deve conter ao menos 3 caracteres')
        })
    ),

    registrations: yup.object({
        description: yup.string().required("A descrição é obrigatória."),
        value: yup.number().required("Valor obrigatório"),
        
    }).required("Dados da matrícula obrigatórios"),
})

export { createSchoolClassSchema }