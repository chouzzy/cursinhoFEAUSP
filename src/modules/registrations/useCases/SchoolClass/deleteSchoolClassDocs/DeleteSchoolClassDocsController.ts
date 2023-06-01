import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./DeleteSchoolClassDocsCheck"
import { DeleteSchoolClassDocsUseCase } from "./DeleteSchoolClassDocsUseCase"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { DocumentsTypes, SchoolClass } from "../../../entities/SchoolClass"
import { validationResponse } from "../../../../../types"

class DeleteSchoolClassDocsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const { schoolClassID, docsID } = req.params

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const deleteSchoolClassDocsUseCase = new DeleteSchoolClassDocsUseCase(schoolClassRepository)
        const response = await deleteSchoolClassDocsUseCase.execute(docsID, schoolClassID)
        
        return res.status(response.statusCode).json({response})
    }
}

export { DeleteSchoolClassDocsController}