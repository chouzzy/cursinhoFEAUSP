import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
import { ListAllSchoolClassProps } from "./ListAllSchoolClassController"
//////

class ListAllSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute({ id, title }: ListAllSchoolClassProps): Promise<validationResponse> {

        const response = await this.schoolClassRepository.listAllSchoolClasses(id, title)
        
        return response
    }
}

export { ListAllSchoolClassUseCase }
