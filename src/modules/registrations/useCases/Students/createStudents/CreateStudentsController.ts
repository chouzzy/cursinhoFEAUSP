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
        stripeSubscriptionID: purcharsedSubscriptions["stripeSubscriptionID"]
        productID: purcharsedSubscriptions["productID"]
        productName: purcharsedSubscriptions["productName"]
        paymentMethod: purcharsedSubscriptions["paymentMethod"]
        paymentStatus: purcharsedSubscriptions["paymentStatus"]
        paymentDate: purcharsedSubscriptions["paymentDate"]
        valuePaid: purcharsedSubscriptions["valuePaid"]
    }[],
    token: string
    paymentMethodID: string
    productSelectedID: string

}

class CreateStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        const studentData: CreateStudentRequestProps = req.body
        
        const {token} = studentData

        const decryptedPaymentMethodString = crypto.AES.decrypt(token, process.env.PCRYPTO_PKEY?? '').toString(crypto.enc.Utf8);

        const paymentMethodID = decryptedPaymentMethodString

        /// instanciação da classe do caso de uso
        const studentsRepository = new StudentsRepository()
        const createStudentUseCase = new CreateStudentUseCase(studentsRepository)

        studentData.paymentMethodID = paymentMethodID

        const response = await createStudentUseCase.execute(studentData)

        return res.status(response.statusCode).json({ response })

    }
}

export { CreateStudentController, CreateStudentRequestProps }