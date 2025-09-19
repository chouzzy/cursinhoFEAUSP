import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { CreatePixDonationUseCase } from "./CreatePixDonationUseCase"

interface CreatePixDonationProps {
    name: Donations["name"]
    email: Donations["email"]
    phoneNumber: Donations["phoneNumber"]
    isPhoneWhatsapp: Donations["isPhoneWhatsapp"]
    gender?: Donations["gender"]
    birth: Donations["birth"]
    state: Donations["state"]
    city: Donations["city"]
    street: Donations["street"]
    homeNumber: Donations["homeNumber"]
    complement?: Donations["complement"]
    district: Donations["district"]
    zipCode: Donations["zipCode"]
    cpf: Donations["cpf"]
    rg: Donations["rg"]
    cnpj: Donations["cnpj"]
    ufrg: Donations["ufrg"]
    valuePaid: Donations["valuePaid"]
    productSelectedID: string
}


class CreatePixDonationController {

    async handle(req: Request, res: Response): Promise<Response> {


        try {

            const pixDonationData: CreatePixDonationProps = req.body

            const donationsRepository = new DonationsRepository()

            const createPixDonationUseCase = new CreatePixDonationUseCase(donationsRepository)

            const response = await createPixDonationUseCase.execute(pixDonationData)

            return res.status(202).json({response})

        } catch (error) {
            return res.status(403).send({ message: String(error) })
        }




    }
}

export { CreatePixDonationController, CreatePixDonationProps }