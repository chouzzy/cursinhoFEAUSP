import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { ListChargesDonationsUseCase } from "./ListChargesDonationUseCase"


class ListChargesDonationController {
    async handle(req: Request, res: Response): Promise<Response> {

        const {donationID} = req.params
        
        const donationsRepository = new DonationsRepository()
        const listChargesDonationUseCase = new ListChargesDonationsUseCase(donationsRepository)

        const response = await listChargesDonationUseCase.execute(donationID)

        return res.status(response.statusCode).json({ response })

    }
}

export { ListChargesDonationController }