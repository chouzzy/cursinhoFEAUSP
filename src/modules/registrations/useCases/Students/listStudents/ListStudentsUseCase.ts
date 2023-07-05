import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ListStudentsCheck"
import { ListStudentsQuery } from "./ListStudentsController"
//////

class ListStudentsUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(studentsRequest: ListStudentsQuery): Promise<validationResponse> {

        const bodyValidation = await checkQuery(studentsRequest)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }


        let { page, pageRange, initDate, endDate } = studentsRequest

        console.log(initDate, endDate)

        if (initDate === undefined || endDate === undefined) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "initDate and endDate cannot be undefined",
            };
        }
        
        const pageAsNumber = parseInt(page?.toString() || "0", 10);
        const pageRangeAsNumber = parseInt(pageRange?.toString() || "10", 10);

        if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "page and pageRange must be numbers",
            }
        }

        const students = await this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber)

        return students
    }
}

export { ListStudentsUseCase }
