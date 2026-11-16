import { validationResponse } from "../../../../../types";
import { normalizarResponsavelLegal, ResponsavelLegalError } from "../../../../../utils/responsavelLegal";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./CreateStudentCheck";
import { CreateStudentRequestProps } from "./CreateStudentsController";


class CreateStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        const { cpf } = studentData

        if (!cpf) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: 'O CPF é obrigatório.',
            })
        }

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
        
        const createdStudent = await this.studentsRepository.createStudentPaymentIntent(studentData)
        
        return createdStudent
    }
    
}

export {CreateStudentUseCase}