import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
//////

class ListSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(): Promise<validationResponse> {


        const response = await this.schoolClassRepository.listAllSchoolClasses()
        
        return response
    }
}

export { ListSchoolClassUseCase }
