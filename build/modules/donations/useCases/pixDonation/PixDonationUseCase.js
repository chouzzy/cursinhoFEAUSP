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
exports.PixDonationUseCase = void 0;
const server_1 = require("../../../../server");
class PixDonationUseCase {
    constructor(donationsRepository) {
        this.donationsRepository = donationsRepository;
    }
    execute(donationData) {
        return __awaiter(this, void 0, void 0, function* () {
            //é responsabilidade do controller validar os dados recebidos na requisição
            try {
                const paymentMethod = yield server_1.stripe.paymentMethods.create({
                    type: 'pix',
                    customer: 'cus_Pm3tgYtrUTsR3y',
                    billing_details: {
                        name: 'Nome do Cliente',
                        email: 'email@example.com'
                    }
                });
                console.log('Código QR ou Chave Pix:', paymentMethod.id);
                return {
                    isValid: true,
                    statusCode: 200,
                    successMessage: paymentMethod.id
                };
            }
            catch (error) {
                console.error('Erro ao criar pagamento Pix:', error);
            }
            return {
                isValid: true,
                statusCode: 200,
                successMessage: ' vo nadaa'
            };
            // const createdDonation = await this.donationsRepository.createDonation(donationData)
            // return createdDonation
        });
    }
}
exports.PixDonationUseCase = PixDonationUseCase;
