import { StripeProducts } from "../../../../../hooks/StripeProducts";
import { stripe } from "../../../../../server";
import { StripeCreateProductProps, validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { ErrorValidation, checkBody } from "./CreateSchoolClassStagesCheck";
import { CreateSchoolClassStagesRequestProps } from "./CreateSchoolClassStagesController";


class CreateSchoolClassStagesUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassStagesData: CreateSchoolClassStagesRequestProps[], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        /// é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(schoolClassStagesData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const createSchoolClassResponse = await this.schoolClassRepository.createStages(schoolClassStagesData, schoolClassID)

        return createSchoolClassResponse
    }

}

export { CreateSchoolClassStagesUseCase }