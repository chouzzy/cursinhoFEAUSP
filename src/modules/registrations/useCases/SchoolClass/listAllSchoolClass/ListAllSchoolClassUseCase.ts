import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository"
import { validationResponse } from "../../../../../types"
import { SchoolClass } from "../../../entities/SchoolClass"
import { ListAllSchoolClassProps } from "./ListAllSchoolClassController"
//////

class ListAllSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(title: SchoolClass["title"]): Promise<validationResponse> {

        console.log(title)
        if (!title) { title = ''}
        console.log(title)
        const response = await this.schoolClassRepository.listAllSchoolClasses(title)
        
        return response
    }
}

export { ListAllSchoolClassUseCase }
