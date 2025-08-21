import { StripeProducts } from "../../../../../hooks/StripeProducts";
import { stripe } from "../../../../../server";
import { StripeCreateProductProps, validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { ErrorValidation, checkBody } from "./CreateSchoolClassCheck";
import { CreateSchoolClassRequestProps } from "./CreateSchoolClassController";


class CreateSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassData: CreateSchoolClassRequestProps): Promise<validationResponse> {

        schoolClassData.stripeProductID = 'no stripe product id registered'

        // Validate the body sent from the frontend service
        const bodyValidation = await checkBody(schoolClassData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const createSchoolClassResponse = await this.schoolClassRepository.createSchoolClass(schoolClassData)
        
        return createSchoolClassResponse
    }

}

export { CreateSchoolClassUseCase }