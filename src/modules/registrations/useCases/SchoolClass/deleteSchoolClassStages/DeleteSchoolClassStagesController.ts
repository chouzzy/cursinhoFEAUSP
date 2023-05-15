import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./DeleteSchoolClassStagesCheck"
import { DeleteSchoolClassStagesUseCase } from "./DeleteSchoolClassStagesUseCase"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { DocumentsTypes, SchoolClass } from "../../../entities/SchoolClass"
import { validationResponse } from "../../../../../types"
import { SchoolClassSelectiveStages } from "@prisma/client"

class DeleteSchoolClassStagesController {
    async handle(req: Request, res: Response): Promise<Response> {
        
        const { schoolClassID, stagesID } = req.params

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const deleteSchoolClassStagesUseCase = new DeleteSchoolClassStagesUseCase(schoolClassRepository)
        const deletedSchoolClassResponse = await deleteSchoolClassStagesUseCase.execute(stagesID, schoolClassID)
        
        return res.status(deletedSchoolClassResponse.statusCode)
            .json({
                schoolClass: deletedSchoolClassResponse.schoolClass,
                errorMessage: deletedSchoolClassResponse.errorMessage ?? "none",
                successMessage: deletedSchoolClassResponse.successMessage ?? "none"
            })
    }
}

export { DeleteSchoolClassStagesController}