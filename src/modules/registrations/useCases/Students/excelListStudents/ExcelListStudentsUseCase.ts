import { validationResponse } from "../../../../../types"
import { Students } from "../../../entities/Students"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
import { checkQuery } from "./ExcelListStudentsCheck"
import { ExcelListStudentsQuery } from "./ExcelListStudentsController"
import { Workbook, Worksheet } from "exceljs"
import { format } from "date-fns" 
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

        let { initDate, endDate } = studentsRequest
        
        if(!initDate) { studentsRequest.initDate = '1979-01-01'}
        if(!endDate) { studentsRequest.endDate = '2999-01-01'}
        if (initDate == undefined) { studentsRequest.initDate = '1979-01-01'}
        if (endDate == undefined) {  studentsRequest.endDate = '2999-01-01'}

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
                
                student.purcharsedSubscriptions.forEach((sub: { paymentDate: string | Date; schoolClassID: string | number; valuePaid: any; txid: any; paymentStatus: any; codigoDesconto: any; paymentMethod: any; matriculaID: any }) => {
                    const paymentDateFormatted = sub.paymentDate 
                        ? format(toBrazilTime(sub.paymentDate), 'dd/MM/yyyy HH:mm') 
                        : '';
                    
                    const createdAtFormatted = student.createdAt
                        ? format(toBrazilTime(student.createdAt), 'dd/MM/yyyy HH:mm')
                        : '';

                    const aceiteCiencia = student.aceiteTermoCiencia ? "Sim" : "Não";
                    const aceiteInscricao = student.aceiteTermoInscricao ? "Sim" : "Não";
                    const emailResponsavel = student.emailResponsavel || "Não"; 

                    const className = classesMap[sub.schoolClassID] || sub.schoolClassID || 'Desconhecida';

                    worksheet.addRow([
                        sub.valuePaid,               
                        paymentDateFormatted,        
                        sub.txid || '',              
                        student.email,               
                        sub.paymentStatus,           
                        sub.codigoDesconto || '',    
                        sub.paymentMethod,           
                        '',                          
                        '',                          
                        student.name,                
                        student.email,               
                        student.email,               
                        emailResponsavel,            
                        student.phoneNumber,         
                        student.cpf,                 
                        student.rg,                  
                        aceiteCiencia,               
                        aceiteInscricao,             
                        sub.matriculaID || '',       
                        className,                   
                        createdAtFormatted           
                    ])
                })
            }
        })

        worksheet.getColumn(4).width = 30;  
        worksheet.getColumn(10).width = 30; 
        worksheet.getColumn(2).width = 20;  
        worksheet.getColumn(20).width = 30; 
        worksheet.getColumn(21).width = 20; 

        const fileBuffer = await workbook.xlsx.writeBuffer()

        return {
            isValid: true,
            statusCode: 202,
            fileBuffer: fileBuffer
        }
    }
}

export { ExcelListStudentsUseCase }