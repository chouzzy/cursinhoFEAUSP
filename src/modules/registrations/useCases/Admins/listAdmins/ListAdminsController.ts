import { Request, Response } from "express";
import { Admins } from "../../../entities/Admins";
import { AdminsRepository} from "../../../repositories/implementations/AdminsRepository";
import { checkQuery, ErrorValidation } from "./ListAdminsCheck";
import { ListAdminsUseCase } from "./ListAdminsUseCase";

interface ListAdminsQuery {
    id?: Admins["id"],
    name?: Admins["name"],
    email?: Admins["email"],
    username?: Admins["username"],
    password?: Admins["password"],
    page?: string,
    pageRange?: string
}

class ListAdminsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const query: ListAdminsQuery = req.query


        // Instanciando o useCase no repositório com as funções
        const adminsRepository = new AdminsRepository()

        const listAdminsUseCase = new ListAdminsUseCase(adminsRepository);

        const response = await listAdminsUseCase.execute(query)

        return res.status(response.statusCode).json(response)

    }
}

export { ListAdminsController, ListAdminsQuery }