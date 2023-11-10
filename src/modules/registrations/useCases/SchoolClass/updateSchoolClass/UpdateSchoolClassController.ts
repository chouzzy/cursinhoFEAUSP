import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./UpdateSchoolClassCheck"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { SchoolClass } from "../../../entities/SchoolClass"
import { UpdateSchoolClassUseCase } from "./UpdateSchoolClassUseCase"

interface UpdateSchoolClassRequestProps {
    
    title: SchoolClass["title"]
    informations: SchoolClass["informations"]
    subscriptions: SchoolClass["subscriptions"]
    selectiveStages: SchoolClass["selectiveStages"]
    status: SchoolClass["status"]
    stripeProductID: SchoolClass["stripeProductID"]
    documents?: SchoolClass["documents"]
    registrations?: SchoolClass["registrations"]
}

class UpdateSchoolClassController {

    async handle(req: Request, res: Response): Promise<Response> {

        const schoolClassData: UpdateSchoolClassRequestProps = req.body
        const { schoolClassID } = req.params

        /// instanciação da classe do caso de uso
        const schoolClasssRepository = new SchoolClassRepository()
        const updateSchoolClassUseCase = new UpdateSchoolClassUseCase(schoolClasssRepository)
        const updatedSchoolClassResponse = await updateSchoolClassUseCase.execute(schoolClassData, schoolClassID)

        ///
        return res.status(updatedSchoolClassResponse.statusCode)
            .json({updatedSchoolClassResponse})
    }
}

export { UpdateSchoolClassController, UpdateSchoolClassRequestProps }