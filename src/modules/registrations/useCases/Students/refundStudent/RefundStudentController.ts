import { Request, Response } from "express"
import { RefundStudentUseCase } from "./RefundStudentUseCase"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"


class RefundStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        const {chargeID, studentID} = req.params
        
        const studentsRepository = new StudentsRepository()
        const refundStudentUseCase = new RefundStudentUseCase(studentsRepository)

        const response = await refundStudentUseCase.execute(studentID, chargeID)

        return res.status(response.statusCode).json({ response })

    }
}

export { RefundStudentController }