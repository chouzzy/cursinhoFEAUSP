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

        const schoolClassDocsData: CreateSchoolClassDocsRequestProps = req.body
        const { schoolClassID } = req.params
        /// é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(schoolClassDocsData)

        if (bodyValidation.isValid === false) {
            return res.status(bodyValidation.statusCode).json({
                errorMessage: bodyValidation.errorMessage
            })
        }

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const createSchoolClassDocsUseCase = new CreateSchoolClassDocsUseCase(schoolClassRepository)
        const createdSchoolClassResponse = await createSchoolClassDocsUseCase.execute(schoolClassDocsData, schoolClassID)
        
        return res.status(createdSchoolClassResponse.statusCode)
            .json({
                schoolClass: createdSchoolClassResponse.schoolClass,
                errorMessage: createdSchoolClassResponse.errorMessage ?? "none",
                successMessage: createdSchoolClassResponse.successMessage ?? "none"
            })
    }
}

export { CreateSchoolClassDocsController, CreateSchoolClassDocsRequestProps }