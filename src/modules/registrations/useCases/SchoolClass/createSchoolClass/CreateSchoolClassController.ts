import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./CreateSchoolClassCheck"
import { CreateSchoolClassUseCase } from "./CreateSchoolClassUseCase"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { SchoolClass } from "../../../entities/SchoolClass"
import { validationResponse } from "../../../../../types"

interface CreateSchoolClassRequestProps {

    title: SchoolClass["title"]
    informations: SchoolClass["informations"]
    subscriptions: SchoolClass["subscriptions"]
    selectiveStages: SchoolClass["selectiveStages"]
    stripeProductID: SchoolClass["stripeProductID"]
    status: SchoolClass["status"]
    documents?: SchoolClass["documents"]
}

class CreateSchoolClassController {
    async handle(req: Request, res: Response): Promise<Response> {

        const schoolClassData: CreateSchoolClassRequestProps = req.body

        /// instanciação da classe do caso de uso
        const schoolClassRepository = new SchoolClassRepository()
        const createSchoolClassUseCase = new CreateSchoolClassUseCase(schoolClassRepository)
        const createdSchoolClassResponse = await createSchoolClassUseCase.execute(schoolClassData)

        return res.status(createdSchoolClassResponse.statusCode)
            .json({ createdSchoolClassResponse })
    }
}

export { CreateSchoolClassController, CreateSchoolClassRequestProps }