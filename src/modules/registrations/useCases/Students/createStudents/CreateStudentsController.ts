import { Request, Response } from "express"
import { Students, purcharsedSubscriptions } from "../../../entities/Students"
import { checkBody, ErrorValidation } from "./CreateStudentCheck"
import { CreateStudentUseCase } from "./CreateStudentUseCase"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"

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
    pursharsedSubscriptions: {
        schoolClassID: purcharsedSubscriptions["schoolClassID"]
        productID: purcharsedSubscriptions["productID"]
        productName: purcharsedSubscriptions["productName"]
        paymentMethod: purcharsedSubscriptions["paymentMethod"]
        paymentStatus: purcharsedSubscriptions["paymentStatus"]
        paymentDate: purcharsedSubscriptions["paymentDate"]
        valuePaid: purcharsedSubscriptions["valuePaid"]
    }[],

}

class CreateStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        const studentData: CreateStudentRequestProps = req.body

        /// instanciação da classe do caso de uso
        const studentsRepository = new StudentsRepository()
        const createStudentUseCase = new CreateStudentUseCase(studentsRepository)
        const response = await createStudentUseCase.execute(studentData)

        return res.status(response.statusCode).json({ response })

    }
}

export { CreateStudentController, CreateStudentRequestProps }