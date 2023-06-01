import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./DeleteDonationCheck";
import { DeleteDonationProps } from "./DeleteDonationController";

class DeleteDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) {}

    async execute(donationID:Donations["id"], donationData: DeleteDonationProps): Promise<validationResponse> {

        const bodyValidation = await checkBody(donationData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }
        
        const deletedDonation = await this.donationsRepository.deleteDonation(donationID, donationData)
        
        return deletedDonation
    }
    
}

export {DeleteDonationUseCase}