import { StripeProducts } from "../../../../../hooks/StripeProducts";
import { stripe } from "../../../../../server";
import { StripeCreateProductProps, validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { ErrorValidation } from "./CreateSchoolClassStagesCheck";
import { CreateSchoolClassStagesRequestProps } from "./CreateSchoolClassStagesController";


class CreateSchoolClassStagesUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassStagesData: CreateSchoolClassStagesRequestProps, schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        const createSchoolClassResponse = await this.schoolClassRepository.createStages(schoolClassStagesData, schoolClassID)

        return createSchoolClassResponse
    }

}

export { CreateSchoolClassStagesUseCase }