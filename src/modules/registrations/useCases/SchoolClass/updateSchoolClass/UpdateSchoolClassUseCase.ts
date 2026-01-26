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

        console.log('BodyValidation:', bodyValidation);

        console.log('After checkBody in UpdateSchoolClassUseCase');
        // if (schoolClassData.subscriptions.price) {
        //     return ({
        //         isValid: false,
        //         statusCode: 403,
        //         errorMessage: "O Stripe não aceita atualizações de preços.",
        //     })
        // }
        console.log('After checkBody in UpdateSchoolClassUseCase');
        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        console.log('Before repository updateSchoolClass in UpdateSchoolClassUseCase');

        const upatedSchoolClassResponse = await this.schoolClassRepository.updateSchoolClass(schoolClassData, schoolClassID)

        return upatedSchoolClassResponse
    }

}

export { UpdateSchoolClassUseCase }