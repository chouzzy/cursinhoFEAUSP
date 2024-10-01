import { Request, Response } from "express"
import { Students, purcharsedSubscriptions } from "../../../entities/Students"
import { checkBody, ErrorValidation } from "./CreateStudentCheck"
import { CreateStudentUseCase } from "./CreateStudentUseCase"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"
import crypto from "crypto-js";

interface CreateStudentRequestProps {

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
        paymentMethod: string,
        currency: string
    },
    // token: string

}

class CreateStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        const studentData: CreateStudentRequestProps = req.body

        // const { token } = studentData

        try {
            // const decryptedPaymentMethodString = crypto.AES.decrypt(token, process.env.PCRYPTO_PKEY ?? 'vasco').toString(crypto.enc.Utf8);

            // const paymentMethodID = decryptedPaymentMethodString

            /// instanciação da classe do caso de uso
            const studentsRepository = new StudentsRepository()
            const createStudentUseCase = new CreateStudentUseCase(studentsRepository)

            // studentData.paymentMethodID = paymentMethodID
            // studentData.paymentMethodID = 'pm_1OmLGuHkzIzO4aMOoxSTDivn'
            const response = await createStudentUseCase.execute(studentData)

            return res.status(response.statusCode).json({ response })
        } catch (error) {
            return res.status(403).json({ error:error })
        }

    }
}

export { CreateStudentController, CreateStudentRequestProps }