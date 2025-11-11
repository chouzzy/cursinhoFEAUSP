import { format } from "date-fns"
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
        
        if(!initDate) { studentsRequest.initDate = '1979-01-01'}
        if(!endDate) { studentsRequest.endDate = '2999-01-01'}

        if (initDate == undefined) { studentsRequest.initDate = '1979-01-01'}
        if (endDate == undefined) {  studentsRequest.endDate = '2999-01-01'}


        const pageAsNumber = parseInt(page?.toString() || "0", 10);
        const pageRangeAsNumber = parseInt(pageRange?.toString() || "10", 10);

        if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
            return {
                isValid: false,
                statusCode: 400,
                errorMessage: "page and pageRange must be numbers",
            }
        }
        
        // A busca no repositório permanece a mesma
        const students = await this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber)
        
        if (students.statusCode != 202) {
            return students
        }

        // Create a new Excel workbook
        const workbook = new Workbook()

        // Add a new worksheet to the workbook
        const worksheet: Worksheet = workbook.addWorksheet("Students")

        // **ETAPA 1: ATUALIZAR OS CABEÇALHOS**
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
        
            // --- NOVAS COLUNAS DE INSCRIÇÃO ---
            "ID Matrícula",
            "Status Pagamento",
            "Valor Pago (R$)",
            "Data Pagamento",
            "Cód. Cupom",
            "Turma (ID)",
            // ---------------------------------
            
            "createdAt (Data de Criação do Aluno)",
        ])

        // **ETAPA 2: ATUALIZAR A LÓGICA DE CRIAÇÃO DE LINHAS**
        // Iteramos por cada estudante E por cada inscrição dentro dele
        students.studentsList?.forEach(student => {
            // Se o estudante não tiver inscrições, ele não aparecerá no relatório de inscrições
            if (student.purcharsedSubscriptions && student.purcharsedSubscriptions.length > 0) {
                
                student.purcharsedSubscriptions.forEach((sub: { matriculaID: any; paymentStatus: any; valuePaid: any; paymentDate: string | number | Date; codigoDesconto: any; schoolClassID: any }) => {
                    // Criamos uma linha para CADA inscrição
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
                    
                        // --- DADOS DAS NOVAS COLUNAS ---
                        sub.matriculaID || '', // ID da Matrícula
                        sub.paymentStatus,     // Status Pagamento
                        sub.valuePaid,         // Valor Pago
                        sub.paymentDate ? format(new Date(sub.paymentDate), 'dd/MM/yyyy HH:mm') : '', // Data Pagamento
                        sub.codigoDesconto || '', // Cód. Cupom
                        sub.schoolClassID,     // Turma (ID)
                        // ------------------------------

                        student.createdAt,
                    ])
                })
            }
            // (Se quiséssemos incluir estudantes sem inscrição, faríamos um 'else' aqui)
        })

        // Formatando colunas (Opcional, mas melhora a leitura)
        worksheet.getColumn('C').width = 30; // Email
        worksheet.getColumn('B').width = 30; // Name
        worksheet.getColumn('O').width = 15; // CPF
        worksheet.getColumn('AB').width = 18; // Status Pagamento
        worksheet.getColumn('AC').width = 15; // Valor Pago
        worksheet.getColumn('AD').width = 20; // Data Pagamento
        worksheet.getColumn('AE').width = 15; // Cód. Cupom
        worksheet.getColumn('AF').width = 30; // Turma (ID)

        // Generate the Excel file
        const fileBuffer = await workbook.xlsx.writeBuffer()

        // Você pode salvar o arquivo para testar se quiser
        // await workbook.xlsx.writeFile("students_export_test.xlsx")

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer // Include the file buffer in the response
        }
    }
}

export { ExcelListStudentsUseCase }