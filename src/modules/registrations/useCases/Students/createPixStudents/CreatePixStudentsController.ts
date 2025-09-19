import { Request, Response } from "express"
import { Students, purcharsedSubscriptions } from "../../../entities/Students"
import { CreateStudentUseCase } from "./CreatePixStudentUseCase"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"

interface CreatePixStudentRequestProps {

    name: Students["name"],
    email: Students["email"],
    gender: Students["gender"],
    birth: Students["birth"],
    phoneNumber: Students["phoneNumber"],
    isPhoneWhatsapp: Students["isPhoneWhatsapp"],

    state: Students["state"]
    city: Students["city"]
    street: Students["street"]
    homeNumber: Students["homeNumber"]
    complement?: Students["complement"]
    district: Students["district"]
    zipCode: Students["zipCode"]

    cpf: Students["cpf"],
    rg: Students["rg"],
    ufrg: Students["ufrg"],
    selfDeclaration: Students["selfDeclaration"],
    oldSchool: Students["oldSchool"],
    oldSchoolAdress: Students["oldSchoolAdress"],
    highSchoolGraduationDate: Students["highSchoolGraduationDate"],
    highSchoolPeriod: Students["highSchoolPeriod"],
    metUsMethod: Students["metUsMethod"],
    exStudent: Students["exStudent"],
    purcharsedSubscriptions: {
        schoolClassID: purcharsedSubscriptions["schoolClassID"]
        paymentMethod: purcharsedSubscriptions["paymentMethod"]
        valuePaid: purcharsedSubscriptions["valuePaid"]
    },

}

class CreatePixStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        try {
        
            const studentData: CreatePixStudentRequestProps = req.body

            /// instanciação da classe do caso de uso
            const studentsRepository = new StudentsRepository()
            const createStudentUseCase = new CreateStudentUseCase(studentsRepository)

            // studentData.paymentMethodID = 'pm_1OmLGuHkzIzO4aMOoxSTDivn'
            const response = await createStudentUseCase.execute(studentData)

            return res.status(response.statusCode).json({ response })
        } catch (error) {
            return res.status(403).json({ error })
        }

    }
}

export { CreatePixStudentController, CreatePixStudentRequestProps }