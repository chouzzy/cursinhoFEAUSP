import { IAdminsRepository } from "../../../repositories/IAdminsRepository"
import { ListAdminsQuery } from "./ListAdminsController"
import { validationResponse } from "../../../../../types"
import { Admins } from "../../../entities/Admins"
import { checkQuery } from "./ListAdminsCheck"
//////

class ListAdminsUseCase {
    constructor(
        private adminsRepository: IAdminsRepository) { }

    async execute(query: ListAdminsQuery): Promise<validationResponse> {

        const queryValidation = await checkQuery(query)

        if (queryValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: queryValidation.errorMessage,
            })
        }
        let {
            id,
            name,
            email,
            username,
            page = '0', 
            pageRange = '10'
        } = query

        const pageNumber = parseInt(page)
        const pageRangeNumber = parseInt(pageRange)

        if (isNaN(pageNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: 'page must be a number',
            }
        }

        if (isNaN(pageRangeNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: 'pageRange must be a number',
            }
        }

        const admins = await this.adminsRepository.filterAdmins(
            id,
            name,
            email,
            username,
            pageNumber,
            pageRangeNumber
        )
        
        return admins
    }
}

export { ListAdminsUseCase }
