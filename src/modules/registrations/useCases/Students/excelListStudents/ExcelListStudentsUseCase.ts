import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ExcelListStudentsCheck"
import { ExcelListStudentsQuery } from "./ExcelListStudentsController"
import { Workbook, Worksheet } from "exceljs"
import { format } from "date-fns" 

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
        
        const students = await this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber)
        
        if (students.statusCode != 202) {
            return students
        }

        // Create a new Excel workbook
        const workbook = new Workbook()

        // Add a new worksheet to the workbook
        const worksheet: Worksheet = workbook.addWorksheet("Inscrições")

        // **ETAPA 1: CABEÇALHOS SOLICITADOS PELO CLIENTE**
        worksheet.addRow([
            "Valor",
            "Data compra",
            "Nº pedido",
            "Email",
            "Estado de pagamento",
            "Cupom de Desconto",
            "Método de pagamento",
            "User_Agent",
            "Referrer",
            "Nome Completo",
            "E-mail para contato",
            "Confirmação do e-mail",
            "Email responsável (se menor)",
            "Telefone",
            "CPF",
            "RG",
            "Termo de Consentimento",
            "Termo de Inscrição",
            // Campos extras úteis (opcionais, mas bons para debug)
            "ID Matrícula",
            "Turma (ID)"
        ])

        // **ETAPA 2: LÓGICA DE DADOS (FLATTEN)**
        students.studentsList?.forEach(student => {
            if (student.purcharsedSubscriptions && student.purcharsedSubscriptions.length > 0) {
                
                student.purcharsedSubscriptions.forEach((sub: { paymentDate: string | number | Date; valuePaid: any; txid: any; paymentStatus: any; codigoDesconto: any; paymentMethod: any; matriculaID: any; schoolClassID: any }) => {
                    // Formatações
                    const paymentDateFormatted = sub.paymentDate ? format(new Date(sub.paymentDate), 'dd/MM/yyyy HH:mm') : '';
                    const aceiteCiencia = student.aceiteTermoCiencia ? "Sim" : "Não";
                    const aceiteInscricao = student.aceiteTermoInscricao ? "Sim" : "Não";
                    const emailResponsavel = student.emailResponsavel || "Não"; // Se vazio, coloca "Não" (regra de negócio para maior de idade)

                    // Criamos a linha seguindo a ordem exata dos cabeçalhos
                    worksheet.addRow([
                        sub.valuePaid,               // Valor
                        paymentDateFormatted,        // Data compra
                        sub.txid || '',              // Nº pedido (usamos txid)
                        student.email,               // Email
                        sub.paymentStatus,           // Estado de pagamento
                        sub.codigoDesconto || '',    // Cupom de Desconto
                        sub.paymentMethod,           // Método de pagamento
                        '',                          // User_Agent (Vazio)
                        '',                          // Referrer (Vazio)
                        student.name,                // Nome Completo
                        student.email,               // E-mail para contato (Repetido)
                        student.email,               // Confirmação do e-mail (Repetido ou Vazio)
                        emailResponsavel,            // Email responsável
                        student.phoneNumber,         // Telefone
                        student.cpf,                 // CPF
                        student.rg,                  // RG
                        aceiteCiencia,               // Termo de Consentimento
                        aceiteInscricao,             // Termo de Inscrição
                        sub.matriculaID || '',       // ID Matrícula (Extra)
                        sub.schoolClassID            // Turma ID (Extra)
                    ])
                })
            }
        })

        // Ajuste de largura das colunas principais
        worksheet.getColumn(4).width = 30;  // Email
        worksheet.getColumn(10).width = 30; // Nome
        worksheet.getColumn(2).width = 20;  // Data

        const fileBuffer = await workbook.xlsx.writeBuffer()

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer
        }
    }
}

export { ExcelListStudentsUseCase }