import { validationResponse } from "../../../../types";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./CreatePixDonationCheck";
import { CreatePixDonationProps } from "./CreatePixDonationController";


class CreatePixDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(pixDonationData: CreatePixDonationProps): Promise<validationResponse> {

        if (!pixDonationData.cpf && pixDonationData.cnpj) {
            pixDonationData.cpf = "Não informado"
        }

        if (pixDonationData.rg === "Não informado") {
            pixDonationData.ufrg = "Não informado"
        }

        if (!pixDonationData.cpf && !pixDonationData.cnpj) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: 'É necessário o envio de CNPJ ou de CPF.',
            })
        }

        const bodyValidation = await checkBody(pixDonationData)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const createdDonation = await this.donationsRepository.createPixDonation(pixDonationData)

        return createdDonation



    }
}

export { CreatePixDonationUseCase }