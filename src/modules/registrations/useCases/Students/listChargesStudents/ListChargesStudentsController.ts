import { Request, Response } from "express"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"
import { ListChargesStudentsUseCase } from "./ListChargesStudentsUseCase"


class ListChargesStudentsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const {studentID} = req.params
        
        const studentsRepository = new StudentsRepository()
        const listChargesStudentUseCase = new ListChargesStudentsUseCase(studentsRepository)

        const response = await listChargesStudentUseCase.execute(studentID)

        return res.status(response.statusCode).json({ response })

    }
}

export { ListChargesStudentsController }