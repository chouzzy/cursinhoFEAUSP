import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { checkBody } from "./UpdateSchoolClassCheck";
import { UpdateSchoolClassRequestProps } from "./UpdateSchoolClassController";

class UpdateSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) {}

    async execute(schoolClassData: UpdateSchoolClassRequestProps, schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        // Validate the body sent from the frontend service
        const bodyValidation = await checkBody(schoolClassData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const upatedSchoolClassResponse = await this.schoolClassRepository.updateSchoolClass(schoolClassData, schoolClassID)
        
        return upatedSchoolClassResponse
    }
    
}

export {UpdateSchoolClassUseCase}