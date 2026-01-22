import { prisma } from "../prisma";
import { format } from "date-fns";

// Interface para representar cada inscrição individual na lista
interface SubscriptionResult {
    schoolClassID: string;
    productName: string | null;
    paymentStatus: string;
    matriculaID: string | null; 
    paymentDate: string | null;
    valuePaid: number;
}

interface TrackingResult {
    found: boolean;
    name?: string;
    email?: string;
    subscriptions?: SubscriptionResult[]; 
}

export class TrackingService {
    /**
     * Busca o status de todas as inscrições de um aluno a partir de um identificador.
     * Prioriza o CPF, mas também aceita Email ou TXID como fallback.
     */
    async track(identifier: string): Promise<TrackingResult> {
        console.log(`[TrackingService] Iniciando busca para o identificador: "${identifier}"`);
        
        const identifierTrimmed = identifier.trim();
        let student = null;

        // 1. Prioridade: Buscar por CPF (Sanitizado)
        // O CPF deve ser único por aluno
        const sanitizedCpf = identifierTrimmed.replace(/\D/g, '');
        if (sanitizedCpf.length === 11) {
             console.log(`[TrackingService] Tentando busca por CPF sanitizado: ${sanitizedCpf}`);
             student = await prisma.students.findFirst({
                where: { cpf: sanitizedCpf },
            });
        }

        // 2. Fallback: Buscar pelo Email (se o identificador parecer um email)
        // IMPORTANTE: Como removemos o @unique do email, usamos findFirst.
        // Se houver múltiplos alunos com mesmo email (ex: irmãos), retornamos o mais recente.
        if (!student && identifierTrimmed.includes('@')) {
            console.log(`[TrackingService] Tentando busca por Email: ${identifierTrimmed}`);
            student = await prisma.students.findFirst({
                where: { email: identifierTrimmed },
                orderBy: { createdAt: 'desc' } // Pega o cadastro mais recente
            });
        }
        
        // 3. Fallback: Buscar por TXID (caso o aluno só tenha o código da transação)
        if (!student) {
            console.log(`[TrackingService] Tentando busca por TXID na lista de subscrições: ${identifierTrimmed}`);
            student = await prisma.students.findFirst({
                where: {
                    purcharsedSubscriptions: {
                        some: { txid: identifierTrimmed },
                    },
                },
            });
        }


        // Se não encontrar o aluno ou ele não tiver nenhuma inscrição vinculada
        if (!student || !student.purcharsedSubscriptions || student.purcharsedSubscriptions.length === 0) {
            console.log(`[TrackingService] Nenhum estudante ou inscrição encontrada para: "${identifier}"`);
            return { found: false };
        }

        console.log(`[TrackingService] Estudante encontrado: ${student.name} (ID: ${student.id})`);
        
        /**
         * Mapeamos todas as inscrições do array 'purcharsedSubscriptions'.
         * Com lógica de lookup para o nome da turma.
         */
        const mappedSubscriptions = await Promise.all(student.purcharsedSubscriptions.map(async (sub, index) => {
            // Forçamos o cast para 'any' para garantir o acesso ao campo productName
            let nomeTurma = (sub as any).productName;
            
            // Se o nome não estiver salvo na inscrição, buscamos na tabela de Turmas
            if (!nomeTurma && sub.schoolClassID) {
                try {
                    const turma = await prisma.schoolClass.findUnique({
                        where: { id: sub.schoolClassID }
                    });
                    if (turma) {
                        nomeTurma = turma.title;
                    }
                } catch (err) {
                    console.error(`[TrackingService] Erro ao buscar turma:`, err);
                }
            }

            return {
                schoolClassID: sub.schoolClassID,
                productName: nomeTurma || 'Turma não identificada', 
                paymentStatus: sub.paymentStatus,
                matriculaID: sub.matriculaID ?? null, 
                paymentDate: sub.paymentDate ? 
                    format(new Date(sub.paymentDate), 'dd/MM/yyyy HH:mm') : null,
                valuePaid: sub.valuePaid || 0,
            };
        }));

        return {
            found: true,
            name: student.name,
            email: student.email,
            subscriptions: mappedSubscriptions,
        };
    }
}