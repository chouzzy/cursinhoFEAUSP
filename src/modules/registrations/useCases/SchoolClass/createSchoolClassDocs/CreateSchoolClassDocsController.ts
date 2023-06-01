import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./CreateSchoolClassDocsCheck"
import { CreateSchoolClassDocsUseCase } from "./CreateSchoolClassDocsUseCase"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { DocumentsTypes, SchoolClass } from "../../../entities/SchoolClass"
import { validationResponse } from "../../../../../types"

interface CreateSchoolClassDocsRequestProps {
    title: DocumentsTypes["title"],
    downloadLink: DocumentsTypes["downloadLink"],
}

class CreateSchoolClassDocsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const schoolClassDocsData: CreateSchoolClassDocsRequestProps[] = req.body
        const { schoolClassID } = req.params

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const createSchoolClassDocsUseCase = new CreateSchoolClassDocsUseCase(schoolClassRepository)
        const response = await createSchoolClassDocsUseCase.execute(schoolClassDocsData, schoolClassID)
        
        return res.status(response.statusCode)
            .json({response})
    }
}

export { CreateSchoolClassDocsController, CreateSchoolClassDocsRequestProps }