import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { checkBody, ErrorValidation } from "./UpdateDonationCheck"
import { UpdateDonationUseCase } from "./UpdateDonationUseCase"

interface UpdateDonationProps {
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
    valuePaid: Donations["valuePaid"]
}


class UpdateDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationData: UpdateDonationProps = req.body

        //é responsabilidade do controller validar os dados recebidos na requisição
        const bodyValidation = await checkBody(donationData)

        if (bodyValidation.isValid === false) {
            return res.status(bodyValidation.statusCode).json({
                errorMessage: bodyValidation.errorMessage
            })
        }


        const donationsRepository = new DonationsRepository()
        const updateDonationUseCase = new UpdateDonationUseCase(donationsRepository)

        const updatedDonation = await updateDonationUseCase.execute(donationData)
        const updatedDonationIsValid = await ErrorValidation(updatedDonation)

        if (updatedDonationIsValid.isValid === false) {
            return res.status(updatedDonationIsValid.statusCode).json({
                errorMessage: updatedDonationIsValid.errorMessage
            })
        }

        return res.status(202).json({
            updatedDonation
        })

    }
}

export { UpdateDonationController, UpdateDonationProps }