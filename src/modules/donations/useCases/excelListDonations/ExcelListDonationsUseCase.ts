import { validationResponse } from "../../../../types"
import { Donations } from "../../entities/Donations"
import { IDonationsRepository } from "../../repositories/IDonationsRepository"
import { checkQuery } from "./ExcelListDonationsCheck"
import { ExcelListDonationsQuery } from "./ExcelListDonationsController"
import { Workbook, Worksheet } from "exceljs"
//////

class ExcelListDonationsUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(donationsRequest: ExcelListDonationsQuery): Promise<validationResponse> {

        //Checando query
        const queryValidation = await checkQuery(donationsRequest)

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

        const donations = await this.donationsRepository.filterDonation(donationsRequest, page, pageRange)
        // console.log(donations)

        if (donations.statusCode != 202) {
            return donations
        }

        // Create a new Excel workbook
        const workbook = new Workbook()

        // Add a new worksheet to the workbook
        const worksheet: Worksheet = workbook.addWorksheet("Donations")

        // Set the columns headers in the worksheet
        worksheet.addRow([
            "id",
            "name",
            "email",
            "phoneNumber",
            "isPhoneWhatsapp",
            "gender",
            "birth",
            "state",
            "city",
            "homeNumber",
            "complement",
            "district",
            "zipCode",
            "street",
            "cpf",
            "rg",
            "valuePaid",
            "paymentMethod",
            "paymentStatus",
            "paymentDate",
            "stripeCustomerID",
            "donationExpirationDate",
            "createdAt",
        ])

        // Iterate through the donations and add them to the worksheet
        donations.donationsList?.forEach(donation => {
            worksheet.addRow([
                donation.id,
                donation.name,
                donation.email,
                donation.phoneNumber,
                donation.isPhoneWhatsapp,
                donation.gender,
                donation.birth,
                donation.state,
                donation.city,
                donation.homeNumber,
                donation.complement,
                donation.district,
                donation.zipCode,
                donation.street,
                donation.cpf,
                donation.rg,
                donation.valuePaid,
                donation.paymentMethod,
                donation.paymentStatus,
                donation.paymentDate,
                donation.stripeCustomerID,
                donation.donationExpirationDate,
                donation.createdAt
            ])
        })

        // Generate the Excel file
        const fileBuffer = await workbook.xlsx.writeBuffer()

        // You can save the file to disk or send it as a response
        // For example, to save the file to disk:
        await workbook.xlsx.writeFile("donations.xlsx")

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer // Include the file buffer in the response
        }
    }
}

export { ExcelListDonationsUseCase }
