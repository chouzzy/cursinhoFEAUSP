import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./UpdateStudentCheck";
import { UpdateStudentRequestProps } from "./UpdateStudentController";

class UpdateStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentData: UpdateStudentRequestProps, studentID: Students["id"]): Promise<validationResponse> {

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
        
        const upatedStudent = await this.studentsRepository.updateStudent(studentData, studentID)
        
        return upatedStudent
    }
    
}

export {UpdateStudentUseCase}