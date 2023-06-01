import { validationResponse } from "../../../../types"
import { Donations } from "../../entities/Donations"
import { IDonationsRepository } from "../../repositories/IDonationsRepository"
import { checkQuery } from "./ListDonationsCheck"
import { ListDonationsQuery } from "./ListDonationsController"
//////

class ListDonationsUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) 
        { }
    
    async execute(donationsRequest:ListDonationsQuery): Promise<validationResponse> {

        //Checando query
        const queryValidation = await checkQuery(donationsRequest)
        
        if (queryValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: queryValidation.errorMessage,
            })
        }

        if (!donationsRequest.page) {donationsRequest.page = 0}
        if (!donationsRequest.pageRange) {donationsRequest.pageRange = 10}

        if (!donationsRequest.initDate) {donationsRequest.initDate = "1979-01-01"}
        if (!donationsRequest.endDate) {donationsRequest.endDate = "2999-01-01"}

        const {page, pageRange} = donationsRequest
        const donations = await this.donationsRepository.filterDonation(donationsRequest, page, pageRange)
        // console.log(donations)
        return donations
    }
}

export {ListDonationsUseCase}
