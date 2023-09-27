import { Request, Response } from "express";
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository";
import { checkQuery } from "./ExcelListDonationsCheck";
import { ExcelListDonationsUseCase } from "./ExcelListDonationsUseCase";

// Nome
// E-mail
// CPF
// Range de valores
// Status de pagamento
// Range de datas

interface ExcelListDonationsQuery {
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



class ExcelListDonationsController {
    async handle(req: Request, res: Response): Promise<Response> {

        const query: ExcelListDonationsQuery = req.query as unknown as ExcelListDonationsQuery;

        // Instanciando o useCase no repositório com as funções
        const donationsRepository = new DonationsRepository()

        const excelListDonationsUseCase = new ExcelListDonationsUseCase(donationsRepository);

        const response = await excelListDonationsUseCase.execute(query)

        if (response.statusCode != 202) {
            return res.status(response.statusCode).json(response)
        }

        // Set the response headers to indicate that we are sending an Excel file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=donations.xlsx');

        // Send the file buffer as the response
        return res.status(response.statusCode).send(response.fileBuffer);

    }
}

export { ExcelListDonationsController, ExcelListDonationsQuery }