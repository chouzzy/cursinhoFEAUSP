import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
import { ListSchoolClassProps } from "./ListSchoolClassController"
//////

class ListSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute({ page, pageRange, status }: ListSchoolClassProps): Promise<validationResponse> {
                
        const pageAsNumber = parseInt(page.toString(), 10)
        const pageRangeAsNumber = parseInt(pageRange.toString(), 10)

        if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "page and pageRange must be numbers",
            }
        }

        const response = await this.schoolClassRepository.listSchoolClasses(pageAsNumber, pageRangeAsNumber, status)
        
        return response
    }
}

export { ListSchoolClassUseCase }
