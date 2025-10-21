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
exports.SantanderPixService = void 0;
const prisma_1 = require("../prisma");
const santanderApiClient_1 = require("../lib/santanderApiClient");
const crypto_1 = require("crypto");
// O valor da taxa de inscrição. Colocamos aqui para fácil manutenção.
// Lembre-se que o Santander espera uma string com duas casas decimais.
const INSCRIPTION_PRICE = "10.00";
class SantanderPixService {
    /**
     * Orquestra a criação de uma nova inscrição e a geração da cobrança PIX.
     * @param inscriptionData - Os dados do estudante vindos do formulário.
     */
    createInscriptionWithPix(inscriptionData) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Gerar um txid único para esta transação
            // O padrão do Santander é [a-zA-Z0-9]{26,35}. Usamos um prefixo para fácil identificação nos logs.
            const txid = `insc-${(0, crypto_1.randomBytes)(14).toString('hex')}`;
            // 2. Salvar a inscrição (Student) no banco de dados com status inicial "PENDENTE"
            const newInscription = yield prisma_1.prisma.students.create({
                data: Object.assign(Object.assign({}, inscriptionData), { 
                    // Como o fluxo é via Santander, geramos um UUID como placeholder
                    // para o campo obrigatório stripeCustomerID.
                    stripeCustomerID: (0, crypto_1.randomUUID)(), purcharsedSubscriptions: [{
                            schoolClassID: inscriptionData.schoolClassID,
                            txid: txid,
                            paymentMethod: "pix_santander",
                            paymentStatus: "PENDENTE",
                            pixStatus: "PENDENTE",
                            paymentDate: new Date(),
                            valuePaid: parseFloat(INSCRIPTION_PRICE),
                        }] }),
            });
            console.log(`Inscrição criada no banco para ${newInscription.name} com txid: ${txid}`);
            // 3. Montar o corpo da requisição para a API do Santander
            const cobData = {
                calendario: {
                    expiracao: 3600, // Cobrança PIX expira em 1 hora
                },
                devedor: {
                    cpf: inscriptionData.cpf,
                    nome: inscriptionData.name,
                },
                valor: {
                    original: INSCRIPTION_PRICE,
                },
                chave: process.env.SANTANDER_PIX_KEY,
                solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
            };
            // 4. Chamar nosso cliente de API para criar a cobrança no Santander
            const santanderResponse = yield santanderApiClient_1.santanderApiClient.createCob(txid, cobData);
            console.log(`Cobrança PIX criada no Santander para o txid: ${txid}`);
            // 5. Opcional, mas recomendado: Atualizar a inscrição no banco com os dados do PIX gerado.
            // Isso permite que você regenere o QR Code para o usuário se ele fechar a página, por exemplo.
            yield prisma_1.prisma.students.update({
                where: { id: newInscription.id },
                data: {
                    purcharsedSubscriptions: {
                        updateMany: {
                            where: { txid: txid },
                            data: {
                                pixCopiaECola: santanderResponse.pixCopiaECola,
                                pixQrCode: santanderResponse.location,
                            }
                        }
                    }
                }
            });
            // 6. Retornar os dados essenciais para o frontend
            return {
                txid: santanderResponse.txid,
                qrCodePayload: santanderResponse.location,
                copiaECola: santanderResponse.pixCopiaECola,
                valor: santanderResponse.valor.original,
            };
        });
    }
}
exports.SantanderPixService = SantanderPixService;
