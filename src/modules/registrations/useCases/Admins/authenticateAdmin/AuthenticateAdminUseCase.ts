import { validationResponse } from "../../../../../types";
import { Admins } from "../../../entities/Admins";
import { Students } from "../../../entities/Students";
import { IAdminsRepository } from "../../../repositories/IAdminsRepository";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { AuthenticateAdminRequestProps } from "./AuthenticateAdminController";


class AuthenticateAdminUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) {}

    async execute(adminData: AuthenticateAdminRequestProps): Promise<validationResponse> {
        
        const authenticatedAdmin = await this.adminsRepository.authenticateAdmin(adminData)
        
        return authenticatedAdmin
    }
    
}

export {AuthenticateAdminUseCase}