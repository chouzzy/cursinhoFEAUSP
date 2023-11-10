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

        if (!createSchoolClassResponse.schoolClass) {
            return createSchoolClassResponse
        }

        const stripeProducts = new StripeProducts()

        const { schoolClass } = createSchoolClassResponse

        const product: StripeCreateProductProps = {
            name: schoolClass.title,
            default_price_data: schoolClass.subscriptions.price,
            description: schoolClass.informations.description,
            metadata: {
                schoolClassID: schoolClass.id,
                productType: 'studentSubscription',
                title: schoolClass.title,
                semester: schoolClass.informations.dateSchedule,
                year: schoolClass.informations.dateSchedule,
            }
        }

        const stripeProductCreated = await stripeProducts.createProduct(product)

        if (!stripeProductCreated.stripeCreatedProductID) {
            return stripeProductCreated
        }

        const { stripeCreatedProductID } = stripeProductCreated

        const updatedSchoolClassResponse = await this.schoolClassRepository.updateSchoolClass(
            schoolClass,
            schoolClass.id,
            stripeCreatedProductID
        )


        return updatedSchoolClassResponse
    }

}

export { CreateSchoolClassUseCase }