import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./CreatePixStudentCheck";
import { CreatePixStudentRequestProps } from "./CreatePixStudentsController";


class CreateStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentData: CreatePixStudentRequestProps): Promise<validationResponse> {

        if (!studentData.rg) {
            studentData.ufrg = "Não informado"
        }

        const bodyValidation = await checkBody(studentData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const createdStudent = await this.studentsRepository.createPixStudent(studentData)
        
        return createdStudent
    }
    
}

export {CreateStudentUseCase}