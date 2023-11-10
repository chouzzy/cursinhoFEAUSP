import { Request, Response } from "express";
import { Students, purcharsedSubscriptions } from "../../../entities/Students";
import { StudentsRepository} from "../../../repositories/implementations/StudentsRepository";
import { checkQuery, ErrorValidation } from "./ListStudentsCheck";
import { ListStudentsUseCase } from "./ListStudentsUseCase";
import { SchoolClass } from "../../../entities/SchoolClass";

interface ListStudentsQuery {
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

class ListStudentsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const query: ListStudentsQuery = req.query as unknown as ListStudentsQuery;

        // Instanciando o useCase no repositório com as funções
        const studentsRepository = new StudentsRepository()
        const listStudentsUseCase = new ListStudentsUseCase(studentsRepository);
        const response = await listStudentsUseCase.execute(query)

        return res.status(response.statusCode).json(response)

    }
}

export { ListStudentsController, ListStudentsQuery }