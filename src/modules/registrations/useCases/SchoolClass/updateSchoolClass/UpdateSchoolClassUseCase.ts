import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { checkBody } from "./UpdateSchoolClassCheck";
import { UpdateSchoolClassRequestProps } from "./UpdateSchoolClassController";

class UpdateSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassData: UpdateSchoolClassRequestProps, schoolClassID: SchoolClass["id"]): Promise<validationResponse> {


        const bodyValidation = await checkBody(schoolClassData)

        if (schoolClassData.subscriptions.price) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: "O Stripe não aceita atualizações de preços.",
            })
        }

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

export { UpdateSchoolClassUseCase }