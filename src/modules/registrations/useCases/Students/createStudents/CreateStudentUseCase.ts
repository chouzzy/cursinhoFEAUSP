import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./CreateStudentCheck";
import { CreateStudentRequestProps } from "./CreateStudentsController";


class CreateStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        const {cpf, rg} = studentData

        // validação que o yup não consegue fazer (um ou outro)
        if (!cpf && !rg) { 
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: 'O CPF ou o RG são obrigatórios.',
            })
        }

        if (!studentData.rg) {
            studentData.ufrg = "NDA"
        }

        const bodyValidation = await checkBody(studentData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const createdStudent = await this.studentsRepository.createStudentPaymentIntent(studentData)
        
        return createdStudent
    }
    
}

export {CreateStudentUseCase}