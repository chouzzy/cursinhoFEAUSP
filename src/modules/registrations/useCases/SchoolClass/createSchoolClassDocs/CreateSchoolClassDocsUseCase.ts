import { StripeProducts } from "../../../../../hooks/StripeProducts";
import { stripe } from "../../../../../server";
import { StripeCreateProductProps, validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { ErrorValidation, checkBody } from "./CreateSchoolClassDocsCheck";
import { CreateSchoolClassDocsRequestProps } from "./CreateSchoolClassDocsController";


class CreateSchoolClassDocsUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassDocsData: CreateSchoolClassDocsRequestProps[], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        
        /// é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(schoolClassDocsData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const createSchoolClassResponse = await this.schoolClassRepository.createDocs(schoolClassDocsData, schoolClassID)

        return createSchoolClassResponse
    }

}

export { CreateSchoolClassDocsUseCase }