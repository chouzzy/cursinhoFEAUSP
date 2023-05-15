import { StripeProducts } from "../../../../../hooks/StripeProducts";
import { stripe } from "../../../../../server";
import { StripeCreateProductProps, validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { ErrorValidation } from "./CreateSchoolClassDocsCheck";
import { CreateSchoolClassDocsRequestProps } from "./CreateSchoolClassDocsController";


class CreateSchoolClassDocsUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassDocsData: CreateSchoolClassDocsRequestProps, schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        const createSchoolClassResponse = await this.schoolClassRepository.createDocs(schoolClassDocsData, schoolClassID)

        return createSchoolClassResponse
    }

}

export { CreateSchoolClassDocsUseCase }