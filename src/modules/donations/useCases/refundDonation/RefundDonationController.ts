import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { RefundDonationUseCase } from "./RefundDonationUseCase"


class RefundDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const {chargeID, donationID} = req.params
        
        const donationsRepository = new DonationsRepository()
        const refundDonationUseCase = new RefundDonationUseCase(donationsRepository)

        const response = await refundDonationUseCase.execute(donationID, chargeID)

        return res.status(response.statusCode).json({ response })

    }
}

export { RefundDonationController }