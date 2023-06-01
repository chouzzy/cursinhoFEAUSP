import { validationResponse } from "../../../../../types";
import { Admins } from "../../../entities/Admins";
import { IAdminsRepository } from "../../../repositories/IAdminsRepository";
import { checkBody } from "./UpdateAdminsPasswordCheck";
import { UpdateAdminPasswordRequestProps } from "./UpdateAdminsPasswordController";

class UpdateAdminsPasswordUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) { }

    async execute(adminData: UpdateAdminPasswordRequestProps, adminID: Admins["id"]): Promise<validationResponse> {

        const bodyValidation = await checkBody(adminData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const upatedAdmin = await this.adminsRepository.updateAdminPassword(adminData, adminID)

        return upatedAdmin
    }

}

export { UpdateAdminsPasswordUseCase }