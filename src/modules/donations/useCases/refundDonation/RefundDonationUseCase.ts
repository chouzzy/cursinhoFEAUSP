import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./RefundDonationCheck";


class RefundDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationID: Donations["id"], chargeID: string): Promise<validationResponse> {

        const bodyValidation = await checkBody(donationID, chargeID)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const refundDonation = await this.donationsRepository.refundDonation(donationID, chargeID)

        return refundDonation
    }

}

export { RefundDonationUseCase }