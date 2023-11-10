import { validationResponse } from "../../../../../types";
import { Admins } from "../../../entities/Admins";
import { IAdminsRepository } from "../../../repositories/IAdminsRepository";
import { checkBody } from "./UpdateAdminsCheck";
import { UpdateAdminRequestProps } from "./UpdateAdminsController";

class UpdateAdminsUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) {}

    async execute(adminData: UpdateAdminRequestProps, adminID: Admins["id"]): Promise<validationResponse> {

        const bodyValidation = await checkBody(adminData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const upatedAdmin = await this.adminsRepository.updateAdmin(adminData, adminID)
        
        return upatedAdmin
    }
    
}

export {UpdateAdminsUseCase}