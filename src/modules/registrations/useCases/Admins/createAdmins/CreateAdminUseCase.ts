import { validationResponse } from "../../../../../types";
import { Admins } from "../../../entities/Admins";
import { Students } from "../../../entities/Students";
import { IAdminsRepository } from "../../../repositories/IAdminsRepository";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkBody } from "./CreateAdminCheck";
import { CreateAdminRequestProps } from "./CreateAdminController";


class CreateAdminUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) {}

    async execute(adminData: CreateAdminRequestProps): Promise<validationResponse> {

        const bodyValidation = await checkBody(adminData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const createdAdmin = await this.adminsRepository.createAdmin(adminData)
        
        return createdAdmin
    }
    
}

export {CreateAdminUseCase}