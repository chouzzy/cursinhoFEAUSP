import { Request, Response } from "express"
import { checkBody, ErrorValidation } from "./UpdateAdminsCheck"
import { AdminsRepository } from "../../../repositories/implementations/AdminsRepository"
import { Admins } from "../../../entities/Admins"
import { UpdateAdminsUseCase } from "./UpdateAdminsUseCase"

interface UpdateAdminRequestProps {

    name: Admins["name"],
    email: Admins["email"],
    username: Admins["username"]
}

class UpdateAdminsController {

    async handle(req: Request, res: Response): Promise<Response> {

        const adminData: UpdateAdminRequestProps = req.body
        const {adminID} = req.params

        /// instanciação da classe do caso de uso
        const adminsRepository = new AdminsRepository()
        const updateAdminsUseCase = new UpdateAdminsUseCase(adminsRepository)
        const response = await updateAdminsUseCase.execute(adminData, adminID)

        return res.status(response.statusCode).json(response)

    }
}

export { UpdateAdminsController, UpdateAdminRequestProps }