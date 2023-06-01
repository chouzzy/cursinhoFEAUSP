import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./CreateDonationCheck";
import { CreateDonationProps } from "./CreateDonationController";


class CreateDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationData: CreateDonationProps): Promise<validationResponse> {

        //é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(donationData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const createdDonation = await this.donationsRepository.createDonation(donationData)

        return createdDonation
    }

}

export { CreateDonationUseCase }