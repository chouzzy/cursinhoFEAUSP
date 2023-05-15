import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";

class DeleteSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) {}

    async execute(schoolClassID:SchoolClass["id"]): Promise<validationResponse> {
        
        const deletedSchoolClass = await this.schoolClassRepository.deleteSchoolClass(schoolClassID)
        
        return deletedSchoolClass
    }
    
}

export {DeleteSchoolClassUseCase}