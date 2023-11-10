import { Request, Response } from "express";
import { Students, purcharsedSubscriptions } from "../../../entities/Students";
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ExcelListStudentsUseCase } from "./ExcelListStudentsUseCase";

interface ExcelListStudentsQuery {
    id?: Students["id"],
    name?: Students["name"],
    email?: Students["email"],
    cpf?: Students["cpf"],
    paymentStatus?: purcharsedSubscriptions["paymentStatus"],
    schoolClassID?: SchoolClass["id"],
    initDate: string,
    endDate: string,
    page?: number,
    pageRange?: number
}

class ExcelListStudentsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const query: ExcelListStudentsQuery = req.query as unknown as ExcelListStudentsQuery;

        // Instanciando o useCase no repositório com as funções
        const studentsRepository = new StudentsRepository()
        const excelListStudentsUseCase = new ExcelListStudentsUseCase(studentsRepository);
        const response = await excelListStudentsUseCase.execute(query)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        // Send the file buffer as the response
        return res.status(response.statusCode).send(response.fileBuffer);

    }
}

export { ExcelListStudentsController, ExcelListStudentsQuery }