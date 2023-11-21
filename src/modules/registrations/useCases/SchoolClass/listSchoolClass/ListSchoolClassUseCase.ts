import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
import { ListSchoolClassProps } from "./ListSchoolClassController"
import { checkBody } from "./ListSchoolClassCheck"
//////

class ListSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute({ page=0, pageRange=9999, status }: ListSchoolClassProps): Promise<validationResponse> {

        if (!page) {
            page = 0
        }

        if (!pageRange) {
            pageRange = 9999
        }
        page = Number(page)
        pageRange = Number(pageRange)

        const bodyValidation = await checkBody({ page, pageRange, status })

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const response = await this.schoolClassRepository.listSchoolClasses(page, pageRange, status)

        return response
    }
}

export { ListSchoolClassUseCase }
