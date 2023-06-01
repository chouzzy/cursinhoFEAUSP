import { Request, Response } from "express"
import { Admins } from "../../../entities/Admins"
import { checkBody, ErrorValidation } from "./CreateAdminCheck"
import { CreateAdminUseCase } from "./CreateAdminUseCase"
import { AdminsRepository } from "../../../repositories/implementations/AdminsRepository"

interface CreateAdminRequestProps {

    name: Admins["name"],
    email: Admins["email"],
    username: Admins["username"],
    password: Admins["password"],
}

class CreateAdminsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const adminData: CreateAdminRequestProps = req.body

        /// instanciação da classe do caso de uso
        const adminsRepository = new AdminsRepository()
        const createAdminUseCase = new CreateAdminUseCase(adminsRepository)
        const response = await createAdminUseCase.execute(adminData)

        return res.status(response.statusCode).json({response})

    }
}

export { CreateAdminsController, CreateAdminRequestProps }