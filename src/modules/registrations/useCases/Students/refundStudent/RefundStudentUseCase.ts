
import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./RefundStudentCheck";


class RefundStudentUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(studentID: Students["id"], chargeID: string): Promise<validationResponse> {

        const bodyValidation = await checkBody(studentID, chargeID)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const refundStudent = await this.studentsRepository.refundStudent(studentID, chargeID)

        return refundStudent
    }

}

export { RefundStudentUseCase }