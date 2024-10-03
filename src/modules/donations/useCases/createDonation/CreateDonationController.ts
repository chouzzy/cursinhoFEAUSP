import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { CreateDonationUseCase } from "./CreateDonationUseCase"
import crypto from "crypto-js";

interface CreateDonationProps {
    name: Donations["name"]
    email: Donations["email"]
    gender?: Donations["gender"]
    birth: Donations["birth"]
    phoneNumber: Donations["phoneNumber"] 
    isPhoneWhatsapp: Donations["isPhoneWhatsapp"] 
    state:Donations["state"]
    city:Donations["city"]
    street:Donations["street"]
    homeNumber:Donations["homeNumber"]
    complement?:Donations["complement"]
    district:Donations["district"]
    zipCode:Donations["zipCode"]
    cpf?: Donations["cpf"]
    rg?: Donations["rg"]
    cnpj?: Donations["cnpj"]
    ufrg?: Donations["ufrg"]
    paymentMethodID: string
    productSelectedID: string
    cycles: number
}


class CreateDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationData: CreateDonationProps = req.body
        
        const {paymentMethodID} = donationData

        if (!paymentMethodID) {
            return res.status(403).send({message:'Token inválido'})
        }

        try {

            // const decryptedPaymentMethodString = crypto.AES.decrypt(paymentMethodID, process.env.CRYPTO_PKEY?? '').toString(crypto.enc.Utf8);

            // if (!decryptedPaymentMethodString) {
            //     return res.status(403).send({message:'Token inválido'}) 
            // }
            // donationData.paymentMethodID =  decryptedPaymentMethodString

            const donationsRepository = new DonationsRepository()
            const createDonationUseCase = new CreateDonationUseCase(donationsRepository)
    

    
            const response = await createDonationUseCase.execute(donationData)
            return res.status(response.statusCode).json({ response })

        } catch (error) {
            return res.status(403).send({message: String(error)})
        }


        

    }
}

export { CreateDonationController, CreateDonationProps }