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

        const {
            page = 0,
            pageRange = 10,
            initDate = "1979-01-01",
            endDate = "2999-01-01",
        } = studentsRequestBody

        
        const pageAsNumber = parseInt(page.toString(), 10)
        const pageRangeAsNumber = parseInt(pageRange.toString(), 10)

        if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "page and pageRange must be numbers",
            }
        }





        const students = await this.studentsRepository.filterStudent(studentsRequestBody, page, pageRange)

        return students
    }
}

export { ListStudentsUseCase }
