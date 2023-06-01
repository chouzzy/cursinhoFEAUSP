import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { checkBody, ErrorValidation } from "./CreateDonationCheck"
import { CreateDonationUseCase } from "./CreateDonationUseCase"

interface CreateDonationProps {
    name:        Donations["name"]
    email:       Donations["email"]
    phoneNumber: Donations["phoneNumber"]
    gender?:      Donations["gender"]
    birth:       Donations["birth"]
    country:     Donations["country"]
    state:       Donations["state"]
    city:        Donations["city"]
    address:     Donations["address"]
    cpf:         Donations["cpf"]
    rg:          Donations["rg"]
    valuePaid:   Donations["valuePaid"]
}


class CreateDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationData:CreateDonationProps = req.body

        const donationsRepository = new DonationsRepository()
        const createDonationUseCase = new CreateDonationUseCase(donationsRepository)
        
        const response = await createDonationUseCase.execute(donationData)

        return res.status(response.statusCode).json({response})

    }
}

export {CreateDonationController, CreateDonationProps}