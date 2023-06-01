import { Request, Response } from "express"
import { Students } from "../../../entities/Students"
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository"
import { ErrorValidation } from "./DeleteStudentCheck"
import { DeleteStudentUseCase } from "./DeleteStudentUseCase"

class DeleteStudentController {
    async handle(req: Request, res: Response): Promise<Response> {

        const studentID:Students["id"] = req.params.studentID

        const studentsRepository = new StudentsRepository()
        const deleteStudentUseCase = new DeleteStudentUseCase(studentsRepository)
        const response = await deleteStudentUseCase.execute(studentID)

        return res.status(response.statusCode).json({response})

    }
}

export {DeleteStudentController}