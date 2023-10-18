import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./ListChargesDonationCheck";


class ListChargesDonationsUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationID: string): Promise<validationResponse> {

        const bodyValidation = await checkBody(donationID)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const refundDonation = await this.donationsRepository.listChargesDonation(donationID)

        return refundDonation
    }

}

export { ListChargesDonationsUseCase }