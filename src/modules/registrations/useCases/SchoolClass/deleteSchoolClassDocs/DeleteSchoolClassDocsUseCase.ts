import { validationResponse } from "../../../../../types";
import { DocumentsTypes, SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";


class DeleteSchoolClassDocsUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(docsID: DocumentsTypes["docsID"], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        const deleteSchoolClassResponse = await this.schoolClassRepository.deleteDocs(docsID, schoolClassID)

        return deleteSchoolClassResponse
    }

}

export { DeleteSchoolClassDocsUseCase }