import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { ErrorValidation, checkBody } from "./DeleteDonationCheck"
import { DeleteDonationUseCase } from "./DeleteDonationUseCase"

interface DeleteDonationProps {
    paymentStatus: string
}

class DeleteDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const donationID:Donations["id"] = req.params.donationID
        const donationData: DeleteDonationProps = req.body

        const donationsRepository = new DonationsRepository()
        const deleteDonationUseCase = new DeleteDonationUseCase(donationsRepository)
        const response = await deleteDonationUseCase.execute(donationID, donationData)

        return res.status(response.statusCode).json({response})

    }
}

export {DeleteDonationController, DeleteDonationProps}