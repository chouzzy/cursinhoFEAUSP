import { validationResponse } from "../../../../../types";
import { SchoolClass, SchoolClassSelectiveStages } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";


class DeleteSchoolClassStagesUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(stagesID: SchoolClassSelectiveStages["stagesID"], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        const deleteSchoolClassResponse = await this.schoolClassRepository.deleteStages(stagesID, schoolClassID)

        return deleteSchoolClassResponse
    }

}

export { DeleteSchoolClassStagesUseCase }