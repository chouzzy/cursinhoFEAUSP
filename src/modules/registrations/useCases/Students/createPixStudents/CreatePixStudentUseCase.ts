import { validationResponse } from "../../../../../types";
import { normalizarResponsavelLegal, ResponsavelLegalError } from "../../../../../utils/responsavelLegal";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./CreatePixStudentCheck";
import { CreatePixStudentRequestProps } from "./CreatePixStudentsController";


class CreateStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentData: CreatePixStudentRequestProps): Promise<validationResponse> {

        const bodyValidation = await checkBody(studentData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        try {
            Object.assign(studentData, normalizarResponsavelLegal(studentData))
        } catch (error) {
            if (error instanceof ResponsavelLegalError) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: error.message,
                })
            }
            throw error
        }
        
        const createdStudent = await this.studentsRepository.createPixStudent(studentData)
        
        return createdStudent
    }
    
}

export {CreateStudentUseCase}