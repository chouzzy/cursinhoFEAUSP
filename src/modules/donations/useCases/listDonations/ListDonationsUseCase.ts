import { validationResponse } from "../../../../types"
import { Donations } from "../../entities/Donations"
import { IDonationsRepository } from "../../repositories/IDonationsRepository"
import { checkQuery } from "./ListDonationsCheck"
import { ListDonationsQuery } from "./ListDonationsController"
//////

class ListDonationsUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationsRequest: ListDonationsQuery): Promise<validationResponse> {

        //Checando query
        if (!donationsRequest.cpf) {
            donationsRequest.cpf = 'Não informado'
        }

        const queryValidation = await checkQuery(donationsRequest)

        if (donationsRequest.cpf === 'Não informado') {
            donationsRequest.cpf = undefined
        }

        if (queryValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: queryValidation.errorMessage,
            })
        }

        donationsRequest.page ??= 0;
        donationsRequest.pageRange ??= 10;
        donationsRequest.initValue ??= 0;
        donationsRequest.endValue ??= 99999999999;
        donationsRequest.initDate ??= '1979-01-01';
        donationsRequest.endDate ??= '2999-01-01';

        let { page, pageRange, initValue, endValue } = donationsRequest

        // Convertendo valores para números
        const validatedPage = parseInt(page as any, 10)
        if (isNaN(validatedPage)) {
            return ({
                isValid: false,
                statusCode: 400,
                errorMessage: "Page must be a number",
            })
        }

        const validatedPageRange = parseInt(pageRange as any, 10)
        if (isNaN(validatedPageRange)) {
            return ({
                isValid: false,
                statusCode: 400,
                errorMessage: "Page range must be a number",
            })
        }

        const validatedInitValue = parseInt(initValue as any, 10)
        if (isNaN(validatedInitValue)) {
            return ({
                isValid: false,
                statusCode: 400,
                errorMessage: "Init value must be a number",
            })
        }

        const validatedEndValue = parseInt(endValue as any, 10)
        if (isNaN(validatedEndValue)) {
            return ({
                isValid: false,
                statusCode: 400,
                errorMessage: "End value must be a number",
            })
        }

        page = validatedPage
        pageRange = validatedPageRange
        donationsRequest.initValue = validatedInitValue
        donationsRequest.endValue = validatedEndValue

        console.log(donationsRequest, page, pageRange)
        const donations = await this.donationsRepository.filterDonation(donationsRequest, page, pageRange)
        return donations
    }
}

export { ListDonationsUseCase }
