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
exports.webhookEfiRoutes = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const webhookEfiRoutes = (0, express_1.Router)();
exports.webhookEfiRoutes = webhookEfiRoutes;
webhookEfiRoutes.post('/pix', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Rota webhook pix acionada');
    try {
        const pixWebhookResponse = req.body;
        console.log(pixWebhookResponse);
        const pixRecebido = pixWebhookResponse.pix[0];
        const donation = yield prisma_1.prisma.donations.update({
            where: {
                txid: pixRecebido.txid
            },
            data: {
                pixStatus: 'CONCLUIDA'
            }
        });
        // const students = await prisma.students.findFirst({
        //   where: {
        //     txid: req.body
        //   }
        // }) 
        if (!donation) {
            console.log(` Pix ${pixRecebido.txid} falhou devido a ausência de donation no banco de dados.`);
            return res.sendStatus(202);
        }
        console.log(` Pix ${pixRecebido.txid} recebido com sucesso.`);
        res.sendStatus(200);
    }
    catch (error) {
        console.error('Erro ao processar o webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
