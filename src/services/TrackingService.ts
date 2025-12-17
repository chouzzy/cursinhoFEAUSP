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
        const identifierTrimmed = identifier.trim();
        let student = null;

        // 1. Prioridade: Buscar por CPF (Sanitizado)
        const sanitizedCpf = identifierTrimmed.replace(/\D/g, '');
        if (sanitizedCpf.length === 11) {
             student = await prisma.students.findFirst({
                where: { cpf: sanitizedCpf },
            });
        }

        // 2. Fallback: Buscar pelo Email único (se o identificador parecer um email)
        if (!student && identifierTrimmed.includes('@')) {
            student = await prisma.students.findUnique({
                where: { email: identifierTrimmed },
            });
        }
        
        // 3. Fallback: Buscar por TXID (caso o aluno só tenha o código da transação)
        if (!student) {
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
            return { found: false };
        }

        /**
         * Mapeamos todas as inscrições do array 'purcharsedSubscriptions'.
         * Mantivemos o nome do campo com o erro de digitação conforme solicitado
         * para garantir a compatibilidade com o seu schema do MongoDB/Prisma.
         */
        const mappedSubscriptions: SubscriptionResult[] = student.purcharsedSubscriptions.map(sub => ({
            schoolClassID: sub.schoolClassID,
            productName: sub.productName ?? 'Inscrição de Turma',
            paymentStatus: sub.paymentStatus,
            matriculaID: sub.matriculaID ?? null, 
            paymentDate: sub.paymentDate ? 
                format(new Date(sub.paymentDate), 'dd/MM/yyyy HH:mm') : null,
            valuePaid: sub.valuePaid || 0,
        }));

        return {
            found: true,
            name: student.name,
            email: student.email,
            subscriptions: mappedSubscriptions,
        };
    }
}