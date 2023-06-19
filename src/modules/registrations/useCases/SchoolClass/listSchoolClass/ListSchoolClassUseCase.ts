import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
import { ListSchoolClassProps } from "./ListSchoolClassController"
//////

class ListSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute({ page, pageRange }: ListSchoolClassProps): Promise<validationResponse> {

        let validatedPage = typeof page === "number" && !isNaN(page) ? page : 0;
        let validatedPageRange = typeof pageRange === "number" && !isNaN(pageRange) ? pageRange : 10;

        const response = await this.schoolClassRepository.listAllSchoolClasses(validatedPage, validatedPageRange)
        
        return response
    }
}

export { ListSchoolClassUseCase }
