import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { CreateDonationUseCase } from "./CreateDonationUseCase"

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
    ufrg: Donations["ufrg"]
    valuePaid: Donations["valuePaid"]
}


class CreateDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationData: CreateDonationProps = req.body

        const donationsRepository = new DonationsRepository()
        const createDonationUseCase = new CreateDonationUseCase(donationsRepository)

        const response = await createDonationUseCase.execute(donationData)

        return res.status(response.statusCode).json({ response })

    }
}

export { CreateDonationController, CreateDonationProps }