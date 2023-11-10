import { Request, Response } from "express"
import { AdminsRepository } from "../../../repositories/implementations/AdminsRepository"
import { Admins } from "../../../entities/Admins"
import { UpdateAdminsPasswordUseCase } from "./UpdateAdminsPasswordUseCase"
import { checkBody, ErrorValidation } from "./UpdateAdminsPasswordCheck"

interface UpdateAdminPasswordRequestProps {
    password: Admins["password"],
}

class UpdateAdminsPasswordController {

    async handle(req: Request, res: Response): Promise<Response> {

        const adminData: UpdateAdminPasswordRequestProps = req.body
        const {adminID} = req.params

        /// instanciação da classe do caso de uso
        const adminsRepository = new AdminsRepository()
        const updateAdminsPasswordUseCase = new UpdateAdminsPasswordUseCase(adminsRepository)
        const response = await updateAdminsPasswordUseCase.execute(adminData, adminID)

        return res.status(response.statusCode).json(response)

    }
}

export { UpdateAdminsPasswordController, UpdateAdminPasswordRequestProps }