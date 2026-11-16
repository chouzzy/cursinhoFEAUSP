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

        const toBrazilTime = (dateInput: Date | string) => {
            const date = new Date(dateInput);
            return new Date(date.getTime() - (3 * 60 * 60 * 1000));
        };

        const montarEnderecoCompleto = (student: Students): string => {
            const complemento = student.complement && student.complement !== 'Não informado'
                ? student.complement
                : '';
            const cidadeUf = [student.city, student.state].filter(Boolean).join('/');
            return [student.street, student.homeNumber, complemento, student.district, cidadeUf]
                .map(parte => (parte ?? '').trim())
                .filter(Boolean)
                .join(', ');
        };

        type LinhaExcel = { student: Students, sub: any };

        // Cada coluna declara o cabeçalho e o valor juntos, para os dois nunca desalinharem.
        // Colunas novas entram no fim, para não deslocar quem já usa a planilha por posição.
        const colunas: { header: string, width?: number, value: (linha: LinhaExcel) => any }[] = [
            { header: "Valor", value: ({ sub }) => sub.valuePaid },
            { header: "Data compra", width: 20, value: ({ sub }) => sub.paymentDate ? format(toBrazilTime(sub.paymentDate), 'dd/MM/yyyy HH:mm') : '' },
            { header: "Nº pedido", value: ({ sub }) => sub.txid || '' },
            { header: "Email", width: 30, value: ({ student }) => student.email },
            { header: "Estado de pagamento", value: ({ sub }) => sub.paymentStatus },
            { header: "Cupom de Desconto", value: ({ sub }) => sub.codigoDesconto || '' },
            { header: "Método de pagamento", value: ({ sub }) => sub.paymentMethod },
            { header: "User_Agent", value: () => '' },
            { header: "Referrer", value: () => '' },
            { header: "Nome Completo", width: 30, value: ({ student }) => student.name },
            { header: "E-mail para contato", value: ({ student }) => student.email },
            { header: "Confirmação do e-mail", value: ({ student }) => student.email },
            { header: "Email responsável (se menor)", value: ({ student }) => student.emailResponsavel || "Não" },
            { header: "Telefone", value: ({ student }) => student.phoneNumber },
            { header: "CPF", value: ({ student }) => student.cpf },
            { header: "Termo de Consentimento", value: ({ student }) => student.aceiteTermoCiencia ? "Sim" : "Não" },
            { header: "Termo de Inscrição", value: ({ student }) => student.aceiteTermoInscricao ? "Sim" : "Não" },
            { header: "ID Matrícula", value: ({ sub }) => sub.matriculaID || '' },
            { header: "Turma", width: 30, value: ({ sub }) => classesMap[sub.schoolClassID] || sub.schoolClassID || 'Desconhecida' },
            { header: "Data Criação (Aluno)", width: 20, value: ({ student }) => student.createdAt ? format(toBrazilTime(student.createdAt), 'dd/MM/yyyy HH:mm') : '' },
            { header: "CEP", value: ({ student }) => student.zipCode || '' },
            { header: "Endereço completo", width: 50, value: ({ student }) => montarEnderecoCompleto(student) },
            { header: "Nome do responsável", width: 30, value: ({ student }) => student.nomeResponsavel || '' },
            { header: "CPF do responsável", value: ({ student }) => student.cpfResponsavel || '' },
        ];

        // CABEÇALHOS
        worksheet.addRow(colunas.map(coluna => coluna.header))

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

                filteredSubs.forEach((sub: any) => {
                    worksheet.addRow(colunas.map(coluna => coluna.value({ student, sub })))
                })
            }
        })

        // Ajuste de largura das colunas
        colunas.forEach((coluna, indice) => {
            if (coluna.width) worksheet.getColumn(indice + 1).width = coluna.width;
        });

        const fileBuffer = await workbook.xlsx.writeBuffer()

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer
        }
    }
}

export { ExcelListStudentsUseCase }