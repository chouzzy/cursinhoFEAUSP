import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { CreateDonationUseCase } from "./CreateDonationUseCase"
import crypto from "crypto-js";

interface CreateDonationProps {
    name: Donations["name"]
    email: Donations["email"]
    phoneNumber: Donations["phoneNumber"] 
    isPhoneWhatsapp: Donations["isPhoneWhatsapp"] 
    gender?: Donations["gender"]
    birth: Donations["birth"]
    state:Donations["state"]
    city:Donations["city"]
    street:Donations["street"]
    homeNumber:Donations["homeNumber"]
    complement?:Donations["complement"]
    district:Donations["district"]
    zipCode:Donations["zipCode"]
    cpf: Donations["cpf"]
    rg: Donations["rg"]
    cnpj: Donations["cnpj"]
    ufrg: Donations["ufrg"]
    valuePaid: Donations["valuePaid"]
    token: string
    paymentMethodID: string
    productSelectedID: string
    cycles: number
}


class CreateDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationData: CreateDonationProps = req.body
        
        const {token } = donationData

        const decryptedPaymentMethodString = crypto.AES.decrypt(token, process.env.PCRYPTO_PKEY?? '').toString(crypto.enc.Utf8);

        const paymentMethodID = decryptedPaymentMethodString
    
        const donationsRepository = new DonationsRepository()
        const createDonationUseCase = new CreateDonationUseCase(donationsRepository)

        donationData.paymentMethodID = paymentMethodID

        const response = await createDonationUseCase.execute(donationData)

        return res.status(response.statusCode).json({ response })

    }
}

export { CreateDonationController, CreateDonationProps }