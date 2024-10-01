import { Request, Response } from "express"
import { Students } from "../../../entities/Students"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"
import { ErrorValidation } from "./CancelSubscriptionCheck"
import { CancelSubscriptionUseCase } from "./CancelSubscriptionUseCase"

class CancelSubscriptionController {
    async handle(req: Request, res: Response): Promise<Response> {

        const studentID:Students["id"] = req.params.studentID
        const stripeSubscriptionID:Students["purcharsedSubscriptions"][0]["stripeSubscriptionID"] = req.params.stripeSubscriptionID

        if (!stripeSubscriptionID) {
            return res.status(404).json({error: 'stripeSubscriptionID necessário.'})
        }

        const studentsRepository = new StudentsRepository()
        const deleteStudentUseCase = new CancelSubscriptionUseCase(studentsRepository)
        const response = await deleteStudentUseCase.execute(studentID, stripeSubscriptionID)

        return res.status(response.statusCode).json(response)

    }
}

export {CancelSubscriptionController}