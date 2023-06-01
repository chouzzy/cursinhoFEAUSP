import { Request, Response } from "express";
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository";
import { checkQuery } from "./ListDonationsCheck";
import { ListDonationsUseCase } from "./ListDonationsUseCase";

// Nome
// E-mail
// CPF
// Range de valores
// Status de pagamento
// Range de datas

interface ListDonationsQuery {
    name?: string;
    email?: string,
    cpf?: string,
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

        const body:ListDonationsQuery = req.body

        // Instanciando o useCase no repositório com as funções
        const donationsRepository = new DonationsRepository()
        
        const listDonationsUseCase = new ListDonationsUseCase(donationsRepository);
        
        const response = await listDonationsUseCase.execute(body)
        
        return res.status(response.statusCode).json(response)

    }
}

export {ListDonationsController, ListDonationsQuery}