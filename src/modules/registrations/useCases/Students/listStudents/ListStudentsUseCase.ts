import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ListStudentsCheck"
import { ListStudentsQuery } from "./ListStudentsController"
//////

class ListStudentsUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(studentsRequestBody: ListStudentsQuery): Promise<validationResponse> {

        const bodyValidation = await checkQuery(studentsRequestBody)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        let {page, pageRange} = studentsRequestBody
        if (!page) { page = 0}
        if (!pageRange) { pageRange = 10}

        
        if (!studentsRequestBody.initDate) {studentsRequestBody.initDate = "1979-01-01"}
        if (!studentsRequestBody.endDate) {studentsRequestBody.endDate = "2999-01-01"}



        const students = await this.studentsRepository.filterStudent(studentsRequestBody, page, pageRange)
        
        return students
    }
}

export { ListStudentsUseCase }
