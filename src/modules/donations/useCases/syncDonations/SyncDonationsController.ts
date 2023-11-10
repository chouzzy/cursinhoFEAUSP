import { Request, Response } from "express";
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository";
import { SyncDonationsUseCase } from "./SyncDonationsUseCase";



class SyncDonationsController {
    async handle(req: Request, res: Response): Promise<Response> {

        // Instanciando o useCase no repositório com as funções
        const donationsRepository = new DonationsRepository()
        
        const syncDonationsUseCase = new SyncDonationsUseCase(donationsRepository);
        
        const response = await syncDonationsUseCase.execute()
        
        return res.status(response.statusCode).json(response)

    }
}

export {SyncDonationsController}