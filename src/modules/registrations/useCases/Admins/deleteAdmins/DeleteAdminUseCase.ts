import { validationResponse } from "../../../../../types";
import { Admins } from "../../../entities/Admins";
import { IAdminsRepository } from "../../../repositories/IAdminsRepository";

class DeleteAdminUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) {}

    async execute(adminID:Admins["id"]): Promise<validationResponse> {
        
        const deletedAdmin = await this.adminsRepository.deleteAdmin(adminID)
        
        return deletedAdmin
    }
    
}

export {DeleteAdminUseCase}