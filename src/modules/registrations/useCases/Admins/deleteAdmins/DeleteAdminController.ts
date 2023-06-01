import { Request, Response } from "express"
import { Admins } from "../../../entities/Admins"
import { AdminsRepository } from "../../../repositories/implementations/AdminsRepository"
import { ErrorValidation } from "./DeleteAdminCheck"
import { DeleteAdminUseCase } from "./DeleteAdminUseCase"

class DeleteAdminController {
    async handle(req: Request, res: Response): Promise<Response> {

        const adminID:Admins["id"] = req.params.adminID

        const adminsRepository = new AdminsRepository()
        const deleteAdminUseCase = new DeleteAdminUseCase(adminsRepository)
        const response = await deleteAdminUseCase.execute(adminID)

        return res.status(response.statusCode).json({response})

    }
}

export {DeleteAdminController}