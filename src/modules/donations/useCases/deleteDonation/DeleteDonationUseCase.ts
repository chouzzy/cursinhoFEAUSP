import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { DeleteDonationProps } from "./DeleteDonationController";

class DeleteDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) {}

    async execute(donationID:Donations["id"], donationData: DeleteDonationProps): Promise<Donations | validationResponse> {
        
        const deletedDonation = await this.donationsRepository.deleteDonation(donationID, donationData)
        
        return deletedDonation
    }
    
}

export {DeleteDonationUseCase}