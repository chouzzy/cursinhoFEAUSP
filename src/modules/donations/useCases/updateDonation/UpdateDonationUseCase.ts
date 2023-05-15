import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./UpdateDonationCheck";
import { UpdateDonationProps } from "./UpdateDonationController";


class UpdateDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) {}

    async execute(donationData:UpdateDonationProps): Promise<Donations | validationResponse> {
        
        const updateDonation = await this.donationsRepository.createDonation(donationData)
        
        return updateDonation
    }
    
}

export {UpdateDonationUseCase}