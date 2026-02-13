import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ExcelListStudentsCheck"
import { ExcelListStudentsQuery } from "./ExcelListStudentsController"
import { Workbook, Worksheet } from "exceljs"
import { format, sub } from "date-fns"
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

        let { initDate, endDate, paymentStatus, schoolClassID } = studentsRequest

        if (!initDate) { studentsRequest.initDate = '1979-01-01' }
        if (!endDate) { studentsRequest.endDate = '2999-01-01' }
        if (initDate == undefined) { studentsRequest.initDate = '1979-01-01' }
        if (endDate == undefined) { studentsRequest.endDate = '2999-01-01' }

        // Conversão das datas de filtro para Date objects para comparação
        const filterStartDate = new Date(studentsRequest.initDate);
        const filterEndDate = new Date(studentsRequest.endDate);
        // Ajuste para garantir que endDate pegue o dia inteiro (até 23:59:59) se necessário, 
        // mas como a query do banco usa lte, assumimos que o formato ISO já está correto ou ajustado.

        // CORREÇÃO: Forçamos a paginação para trazer TUDO para o Excel
        const pageAsNumber = 1;
        const pageRangeAsNumber = 9999999; // Número alto para garantir que pegue todos

        const students = await this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber)

        if (students.statusCode != 202) {
            return students
        }

        // Buscar todas as turmas para mapear ID -> Nome
        const allClasses = await prisma.schoolClass.findMany({
            select: { id: true, title: true }
        });

        const classesMap: Record<string, string> = {};
        allClasses.forEach(cls => {
            classesMap[cls.id] = cls.title;
        });

        const workbook = new Workbook()
        const worksheet: Worksheet = workbook.addWorksheet("Inscrições")

        // CABEÇALHOS
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
            "Turma",
            "Data Criação (Aluno)"
        ])

        const toBrazilTime = (dateInput: Date | string) => {
            const date = new Date(dateInput);
            return new Date(date.getTime() - (3 * 60 * 60 * 1000));
        };

        // DADOS
        students.studentsList?.forEach(student => {
            if (student.purcharsedSubscriptions && student.purcharsedSubscriptions.length > 0) {

                // Filtramos as subscrições para garantir que apenas as que batem com o filtro sejam exportadas
                const filteredSubs = student.purcharsedSubscriptions.filter((sub: { paymentStatus: string; schoolClassID: string; paymentDate: string | number | Date }) => {
                    let isValid = true;

                    // Filtro de Status
                    if (paymentStatus && sub.paymentStatus !== paymentStatus) {
                        isValid = false;
                    }

                    // Filtro de Turma
                    if (schoolClassID && sub.schoolClassID !== schoolClassID) {
                        isValid = false;
                    }

                    // Filtro de Data
                    if (sub.paymentDate) {
                        const subDate = new Date(sub.paymentDate);
                        if (subDate < filterStartDate || subDate > filterEndDate) {
                            isValid = false;
                        }
                    } else if (initDate && initDate !== '1979-01-01') {
                        // Se tem filtro de data mas a subscrição não tem data, exclui?
                        // Geralmente sim, se o filtro é restritivo.
                        isValid = false;
                    }

                    return isValid;
                });

                filteredSubs.forEach((sub: { paymentDate: string | Date; schoolClassID: string | number; valuePaid: any; txid: any; paymentStatus: any; codigoDesconto: any; paymentMethod: any; matriculaID: any }) => {
                    // Formatações com ajuste de Fuso Horário
                    const paymentDateFormatted = sub.paymentDate
                        ? format(toBrazilTime(sub.paymentDate), 'dd/MM/yyyy HH:mm')
                        : '';

                    const createdAtFormatted = student.createdAt
                        ? format(toBrazilTime(student.createdAt), 'dd/MM/yyyy HH:mm')
                        : '';

                    const aceiteCiencia = student.aceiteTermoCiencia ? "Sim" : "Não";
                    const aceiteInscricao = student.aceiteTermoInscricao ? "Sim" : "Não";
                    const emailResponsavel = student.emailResponsavel || "Não";

                    // Busca o nome da turma no mapa
                    const className = classesMap[sub.schoolClassID] || sub.schoolClassID || 'Desconhecida';

                    // Criamos a linha
                    worksheet.addRow([
                        sub.valuePaid,               // Valor
                        paymentDateFormatted,        // Data compra (CORRIGIDA)
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
                        className,                   // Nome da Turma
                        createdAtFormatted           // Data Criação (CORRIGIDA)
                    ])
                })
            }
        })

        // Ajuste de largura das colunas
        worksheet.getColumn(4).width = 30;  // Email
        worksheet.getColumn(10).width = 30; // Nome
        worksheet.getColumn(2).width = 20;  // Data Pagamento
        worksheet.getColumn(20).width = 30; // Turma
        worksheet.getColumn(21).width = 20; // Data Criação

        const fileBuffer = await workbook.xlsx.writeBuffer()

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer
        }
    }
}

export { ExcelListStudentsUseCase }