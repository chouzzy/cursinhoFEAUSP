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
const server_1 = require("../server");
const webhookEfiRoutes = (0, express_1.Router)();
exports.webhookEfiRoutes = webhookEfiRoutes;
webhookEfiRoutes.post('/pix', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Rota webhook pix acionada');
    console.log('req');
    console.log(req.body);
    try {
        // Validação básica (ajuste conforme a documentação da Efi)
        // Processar os dados da requisição
        // Salvar as informações do pagamento no banco de dados ou realizar outras ações
        server_1.io.emit('pagamentoConfirmado', {
            // Enviar os dados relevantes do pagamento
            idTransacao: req.body.idTransacao,
            valor: req.body.valor,
            // ... outros dados relevantes
        });
        console.log('tudo certo');
        res.sendStatus(200);
    }
    catch (error) {
        console.error('Erro ao processar o webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
