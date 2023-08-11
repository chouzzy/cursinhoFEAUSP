import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ExcelListStudentsCheck"
import { ExcelListStudentsQuery } from "./ExcelListStudentsController"
import { Workbook, Worksheet } from "exceljs"
//////

class ExcelListStudentsUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(studentsRequest: ExcelListStudentsQuery): Promise<validationResponse> {

        const bodyValidation = await checkQuery(studentsRequest)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }


        let { page, pageRange, initDate, endDate } = studentsRequest

        console.log(initDate, endDate)

        if (initDate === undefined || endDate === undefined) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "initDate and endDate cannot be undefined",
            };
        }

        const pageAsNumber = parseInt(page?.toString() || "0", 10);
        const pageRangeAsNumber = parseInt(pageRange?.toString() || "10", 10);

        if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "page and pageRange must be numbers",
            }
        }

        const students = await this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber)

        if (students.statusCode != 202) {
            return students
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
            "gender",
            "birth",
            "phoneNumber",
            "isPhoneWhatsapp",
        
            "state",
            "city",
            "street",
            "homeNumber",
            "complement",
            "district",
            "zipCode",
        
            "cpf",
            "rg",
            "selfDeclaration",
            "oldSchool",
            "oldSchoolAdress",
            "highSchoolGraduationDate",
            "highSchoolPeriod",
            "metUsMethod",
            "exStudent",
            "stripeCustomerID",
        
            "purcharsedSubscriptions",
            "createdAt",
        ])

        // Iterate through the students and add them to the worksheet
        students.studentsList?.forEach(student => {
            worksheet.addRow([
                student.id,
                student.name,
                student.email,
                student.gender,
                student.birth,
                student.phoneNumber,
                student.isPhoneWhatsapp,
            
                student.state,
                student.city,
                student.street,
                student.homeNumber,
                student.complement,
                student.district,
                student.zipCode,
            
                student.cpf,
                student.rg,
                student.selfDeclaration,
                student.oldSchool,
                student.oldSchoolAdress,
                student.highSchoolGraduationDate,
                student.highSchoolPeriod,
                student.metUsMethod,
                student.exStudent,
                student.stripeCustomerID,
            
                student.purcharsedSubscriptions,
                student.createdAt,
            ])
        })

        // Generate the Excel file
        const fileBuffer = await workbook.xlsx.writeBuffer()

        // You can save the file to disk or send it as a response
        // For example, to save the file to disk:
        await workbook.xlsx.writeFile("students.xlsx")

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer // Include the file buffer in the response
        }
    }
}

export { ExcelListStudentsUseCase }
