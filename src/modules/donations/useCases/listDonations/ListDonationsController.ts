import { Request, Response } from "express";
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository";
import { ListDonationsUseCase } from "./ListDonationsUseCase";


interface ListDonationsQuery {
    name?: string;
    email?: string,
    cpf?: string,
    cnpj?: string,
    paymentStatus?: string,
    initValue?: number,
    endValue?: number,
    initDate: string,
    endDate: string,
    page?: number,
    pageRange?: number
}


class ListDonationsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const query: ListDonationsQuery = req.query as unknown as ListDonationsQuery;

        // Instanciando o useCase no repositório com as funções
        const donationsRepository = new DonationsRepository()
        
        const listDonationsUseCase = new ListDonationsUseCase(donationsRepository);
        
        const response = await listDonationsUseCase.execute(query)
        
        return res.status(response.statusCode).json(response)

    }
}

export {ListDonationsController, ListDonationsQuery}