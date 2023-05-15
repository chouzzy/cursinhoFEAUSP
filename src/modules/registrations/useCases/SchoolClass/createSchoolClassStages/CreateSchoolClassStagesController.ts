import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./CreateSchoolClassStagesCheck"
import { CreateSchoolClassStagesUseCase } from "./CreateSchoolClassStagesUseCase"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { DocumentsTypes, SchoolClass } from "../../../entities/SchoolClass"
import { validationResponse } from "../../../../../types"
import { SchoolClassSelectiveStages } from "@prisma/client"

interface CreateSchoolClassStagesRequestProps {
    when: SchoolClassSelectiveStages["when"]
    resultsDate: SchoolClassSelectiveStages["resultsDate"]
    description: SchoolClassSelectiveStages["description"]
}

class CreateSchoolClassStagesController {
    async handle(req: Request, res: Response): Promise<Response> {

        const schoolClassStagesData: CreateSchoolClassStagesRequestProps = req.body
        const { schoolClassID } = req.params

        /// é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(schoolClassStagesData)

        if (bodyValidation.isValid === false) {
            return res.status(bodyValidation.statusCode).json({
                errorMessage: bodyValidation.errorMessage
            })
        }

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const createSchoolClassStagesUseCase = new CreateSchoolClassStagesUseCase(schoolClassRepository)
        const createdSchoolClassResponse = await createSchoolClassStagesUseCase.execute(schoolClassStagesData, schoolClassID)
        
        return res.status(createdSchoolClassResponse.statusCode)
            .json({
                schoolClass: createdSchoolClassResponse.schoolClass,
                errorMessage: createdSchoolClassResponse.errorMessage ?? "none",
                successMessage: createdSchoolClassResponse.successMessage ?? "none"
            })
    }
}

export { CreateSchoolClassStagesController, CreateSchoolClassStagesRequestProps }