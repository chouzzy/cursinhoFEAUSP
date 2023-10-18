
import { validationResponse } from "../../../../../types";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./ListChargesStudentsCheck";


class ListChargesStudentsUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(studentID: string): Promise<validationResponse> {

        const bodyValidation = await checkBody(studentID)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const refundStudent = await this.studentsRepository.listChargesStudent(studentID)

        return refundStudent
    }

}

export { ListChargesStudentsUseCase }