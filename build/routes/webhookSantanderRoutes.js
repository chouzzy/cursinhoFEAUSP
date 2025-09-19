"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookSantanderRoutes = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const webhookSantanderRoutes = (0, express_1.Router)();
exports.webhookSantanderRoutes = webhookSantanderRoutes;
// Criamos uma rota específica, por exemplo, /santander
webhookSantanderRoutes.post('/santander', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Webhook Santander PIX acionado');
    try {
        // O corpo da requisição do Santander é um array de transações
        const pixNotifications = req.body.pix;
        // Verificamos se o corpo é um array e se tem itens
        if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
            console.log('Payload do webhook Santander vazio ou em formato inesperado.');
            return res.sendStatus(200); // Retornamos 200 para o Santander não tentar de novo
        }
        // Processamos cada notificação recebida (geralmente vem uma por vez)
        for (const pixRecebido of pixNotifications) {
            console.log(`Processando txid: ${pixRecebido.txid}`);
            // A lógica de busca no banco é a mesma que você já tem
            const donation = yield prisma_1.prisma.donations.findFirst({
                where: {
                    txid: pixRecebido.txid
                }
            });
            if (donation) {
                yield prisma_1.prisma.donations.update({
                    where: {
                        txid: pixRecebido.txid
                    },
                    data: {
                        pixStatus: 'CONCLUIDA',
                        paymentStatus: 'CONCLUIDA'
                    }
                });
                console.log(`Doação com txid ${pixRecebido.txid} atualizada para CONCLUIDA.`);
            }
            else {
                // Se não for doação, procura em assinaturas de estudantes
                const student = yield prisma_1.prisma.students.findFirst({
                    where: {
                        purcharsedSubscriptions: {
                            some: {
                                txid: pixRecebido.txid
                            }
                        }
                    }
                });
                if (student) {
                    yield prisma_1.prisma.students.update({
                        where: { id: student.id },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: { txid: pixRecebido.txid },
                                    data: {
                                        paymentStatus: "CONCLUIDA",
                                        pixStatus: "CONCLUIDA",
                                    }
                                }
                            }
                        }
                    });
                    console.log(`Assinatura do estudante ${student.name} (txid: ${pixRecebido.txid}) atualizada para CONCLUIDA.`);
                }
                else {
                    console.warn(`Nenhuma doação ou assinatura encontrada para o txid: ${pixRecebido.txid}`);
                }
            }
        }
        res.sendStatus(200); // Envia a resposta de sucesso para o Santander
    }
    catch (error) {
        console.error('Erro ao processar o webhook do Santander:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
