import { Request, Response } from "express"
import { Students } from "../../../entities/Students"
import { checkBody, ErrorValidation } from "./UpdateStudentCheck"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"
import { UpdateStudentUseCase } from "./UpdateStudentUseCase"

interface UpdateStudentRequestProps {

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
    pursharsedSubscriptions?:Students["purcharsedSubscriptions"],
}

class UpdateStudentController {

    async handle(req: Request, res: Response): Promise<Response> {

        const studentData: UpdateStudentRequestProps = req.body
        const {studentID} = req.params


        /// instanciação da classe do caso de uso
        const studentsRepository = new StudentsRepository()
        const updateStudentUseCase = new UpdateStudentUseCase(studentsRepository)
        const response = await updateStudentUseCase.execute(studentData, studentID)

        return res.status(response.statusCode).json(response)

    }
}

export { UpdateStudentController, UpdateStudentRequestProps }