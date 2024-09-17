import { stripe } from "../../../../server";
import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { IDonationsRepository } from "../../repositories/IDonationsRepository";
import { checkBody } from "./PixDonationCheck";
import { CreateDonationProps } from "./PixDonationController";


class PixDonationUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationData: CreateDonationProps): Promise<validationResponse> {

        //é responsabilidade do controller validar os dados recebidos na requisição

        try {

            const paymentMethod = await stripe.paymentMethods.create({
                type: 'pix',
                customer: 'cus_Pm3tgYtrUTsR3y',
                billing_details: {
                  name: 'Nome do Cliente',
                  email: 'email@example.com'
                }
              });

            console.log('Código QR ou Chave Pix:', paymentMethod.id);
            return {
                isValid:true,
                statusCode:200,
                successMessage:paymentMethod.id
            }
        } catch (error) {
            console.error('Erro ao criar pagamento Pix:', error);
        }
        
        return {
            isValid:true,
            statusCode:200,
            successMessage:' vo nadaa'
        }
        // const createdDonation = await this.donationsRepository.createDonation(donationData)

        // return createdDonation

    }

}

export { PixDonationUseCase }