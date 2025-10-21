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
exports.inscriptionsRoutes = void 0;
const express_1 = require("express");
const SantanderPixService_1 = require("../services/SantanderPixService");
const inscriptionsRoutes = (0, express_1.Router)();
exports.inscriptionsRoutes = inscriptionsRoutes;
// Instanciamos o serviço que contém nossa lógica de negócio
const santanderPixService = new SantanderPixService_1.SantanderPixService();
/**
 * Rota para criar uma nova inscrição e gerar a cobrança PIX correspondente.
 * Espera receber no corpo (body) da requisição os dados do estudante
 * que correspondem ao tipo 'InscriptionData' definido no serviço.
 */
inscriptionsRoutes.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Recebida nova requisição de inscrição via PIX Santander.");
    try {
        // Os dados do formulário de inscrição virão no corpo da requisição
        const inscriptionData = req.body;
        // Validação básica para garantir que o corpo não está vazio
        if (!inscriptionData || Object.keys(inscriptionData).length === 0) {
            return res.status(400).json({ error: 'Corpo da requisição vazio. Nenhum dado de inscrição foi enviado.' });
        }
        // Chamamos o serviço que faz todo o trabalho pesado
        const pixResponse = yield santanderPixService.createInscriptionWithPix(inscriptionData);
        // Se tudo deu certo, retornamos os dados do PIX para o frontend
        return res.status(201).json(pixResponse);
    }
    catch (error) {
        console.error('Erro ao criar inscrição com PIX:', error.message);
        // Retornamos um erro genérico para o frontend por segurança
        return res.status(500).json({
            error: 'Falha ao gerar a cobrança PIX.',
            details: 'Ocorreu um erro interno no servidor.' // Evitamos expor detalhes do erro
        });
    }
}));
// ```
// ### **O que este código faz:**
// * **Importa o `Router`** do Express e nosso `SantanderPixService`.
// * **Cria uma instância** do serviço.
// * **Define uma rota `POST`** no caminho raiz (`/`).
// * **Chama o método `createInscriptionWithPix`**, passando os dados (`req.body`) que vêm do frontend.
// * **Trata o sucesso**, enviando um status `201` (Created) e os dados do PIX.
// * **Trata o erro**, enviando um status `500` e uma mensagem genérica para não expor detalhes da implementação ao cliente.
// ### **Seus Próximos Passos:**
// 1.  **Crie o arquivo** `src/routes/inscriptionsRoutes.ts` e cole este código.
// 2.  **Integre a rota no seu servidor principal**. Vá até seu arquivo `server.ts` (ou `app.ts`) e adicione as seguintes linhas:
//     ```typescript
