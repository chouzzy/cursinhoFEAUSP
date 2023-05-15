import { Request, Response } from "express"
import { SchoolClass } from "../../../entities/SchoolClass"
import { SchoolClassRepository } from "../../../repositories/implementations/SchoolClassRepository"
import { ErrorValidation } from "./DeleteSchoolClassCheck"
import { DeleteSchoolClassUseCase } from "./DeleteSchoolClassUseCase"

class DeleteSchoolClassController {
    async handle(req: Request, res: Response): Promise<Response> {

        const schoolClassID:SchoolClass["id"] = req.params.schoolClassID

        const schoolClassRepository = new SchoolClassRepository()
        const deleteSchoolClassUseCase = new DeleteSchoolClassUseCase(schoolClassRepository)
        const deletedSchoolClass = await deleteSchoolClassUseCase.execute(schoolClassID)

        return res.status(deletedSchoolClass.statusCode)
        .json({ deletedSchoolClass })

    }
}

export {DeleteSchoolClassController}