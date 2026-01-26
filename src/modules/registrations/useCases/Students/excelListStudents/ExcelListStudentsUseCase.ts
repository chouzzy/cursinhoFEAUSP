import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ExcelListStudentsCheck"
import { ExcelListStudentsQuery } from "./ExcelListStudentsController"
import { Workbook, Worksheet } from "exceljs"
import { format } from "date-fns" 
// Importamos o prisma para buscar os nomes das turmas
import { prisma } from "../../../../../prisma"; 

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

        // **NOVO: Buscar todas as turmas para mapear ID -> Nome**
        // Isso evita fazer uma query por linha e deixa a exportação rápida
        const allClasses = await prisma.schoolClass.findMany({
            select: { id: true, title: true }
        });
        
        // Criamos um dicionário para acesso rápido: { 'id_123': 'Turma Manhã', ... }
        const classesMap: Record<string, string> = {};
        allClasses.forEach(cls => {
            classesMap[cls.id] = cls.title;
        });

        // Create a new Excel workbook
        const workbook = new Workbook()

        // Add a new worksheet to the workbook
        const worksheet: Worksheet = workbook.addWorksheet("Inscrições")

        // **ETAPA 1: CABEÇALHOS**
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
            // Campos extras úteis
            "ID Matrícula",
            "Turma" // Agora mostrará o Nome
        ])

        // **ETAPA 2: PREENCHIMENTO DOS DADOS**
        students.studentsList?.forEach(student => {
            if (student.purcharsedSubscriptions && student.purcharsedSubscriptions.length > 0) {
                
                student.purcharsedSubscriptions.forEach((sub: { paymentDate: string | number | Date; schoolClassID: string | number; valuePaid: any; txid: any; paymentStatus: any; codigoDesconto: any; paymentMethod: any; matriculaID: any }) => {
                    // Formatações
                    const paymentDateFormatted = sub.paymentDate ? format(new Date(sub.paymentDate), 'dd/MM/yyyy HH:mm') : '';
                    const aceiteCiencia = student.aceiteTermoCiencia ? "Sim" : "Não";
                    const aceiteInscricao = student.aceiteTermoInscricao ? "Sim" : "Não";
                    const emailResponsavel = student.emailResponsavel || "Não"; 

                    // Busca o nome da turma no mapa, ou usa o ID se não encontrar
                    const className = classesMap[sub.schoolClassID] || sub.schoolClassID || 'Desconhecida';

                    // Criamos a linha
                    worksheet.addRow([
                        sub.valuePaid,               // Valor
                        paymentDateFormatted,        // Data compra
                        sub.txid || '',              // Nº pedido (usamos txid)
                        student.email,               // Email
                        sub.paymentStatus,           // Estado de pagamento
                        sub.codigoDesconto || '',    // Cupom de Desconto
                        sub.paymentMethod,           // Método de pagamento
                        '',                          // User_Agent
                        '',                          // Referrer
                        student.name,                // Nome Completo
                        student.email,               // E-mail para contato
                        student.email,               // Confirmação do e-mail
                        emailResponsavel,            // Email responsável
                        student.phoneNumber,         // Telefone
                        student.cpf,                 // CPF
                        student.rg,                  // RG
                        aceiteCiencia,               // Termo de Consentimento
                        aceiteInscricao,             // Termo de Inscrição
                        sub.matriculaID || '',       // ID Matrícula
                        className                    // Nome da Turma (ATUALIZADO)
                    ])
                })
            }
        })

        // Ajuste de largura das colunas para leitura fácil
        worksheet.getColumn(4).width = 30;  // Email
        worksheet.getColumn(10).width = 30; // Nome
        worksheet.getColumn(2).width = 20;  // Data
        worksheet.getColumn(20).width = 30; // Turma

        const fileBuffer = await workbook.xlsx.writeBuffer()

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer
        }
    }
}

export { ExcelListStudentsUseCase }