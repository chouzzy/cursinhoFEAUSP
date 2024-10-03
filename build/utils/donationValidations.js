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
exports.updateDonationPix = exports.createDonationPix = void 0;
const prisma_1 = require("../prisma");
function createDonationPix(pixDonationData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, phoneNumber, isPhoneWhatsapp, gender, birth, state, city, street, homeNumber, complement, district, zipCode, cpf, rg, cnpj, ufrg, valuePaid, } = pixDonationData;
            const createdDonation = yield prisma_1.prisma.donations.create({
                data: {
                    name: name,
                    email: email,
                    phoneNumber: phoneNumber,
                    isPhoneWhatsapp: isPhoneWhatsapp,
                    gender: gender !== null && gender !== void 0 ? gender : 'Não informado',
                    birth: birth,
                    state: state,
                    city: city,
                    street: street,
                    homeNumber: homeNumber,
                    complement: complement !== null && complement !== void 0 ? complement : 'Não informado',
                    district: district,
                    zipCode: zipCode,
                    cpf: cpf,
                    rg: rg !== null && rg !== void 0 ? rg : 'Não informado',
                    cnpj: cnpj !== null && cnpj !== void 0 ? cnpj : 'Não informado',
                    ufrg: ufrg,
                    valuePaid: 0,
                    paymentMethod: 'PIX',
                    paymentStatus: 'Sem informação ainda',
                    paymentDate: new Date(),
                    stripeCustomerID: 'Sem informação ainda',
                    stripeSubscriptionID: 'Pagamento via Efí',
                    ciclePaid: 1,
                    ciclesBought: 1,
                    valueBought: pixDonationData.valuePaid,
                    txid: null,
                    pixCopiaECola: null,
                    pixQrCode: null,
                    pixStatus: null,
                    pixValor: null,
                    pixDate: null,
                    pixExpiracaoEmSegundos: null,
                    donationExpirationDate: null
                }
            });
            return createdDonation;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.createDonationPix = createDonationPix;
function updateDonationPix(pixData, createdDonation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { txid, pixCopiaECola, location, status, valor, calendario } = pixData;
            console.log('valor');
            console.log(valor);
            console.log('valor.original');
            console.log(valor.original);
            const updatedDonation = yield prisma_1.prisma.donations.update({
                where: {
                    id: createdDonation.id
                },
                data: {
                    txid: txid,
                    pixCopiaECola: pixCopiaECola,
                    pixQrCode: location,
                    pixStatus: status,
                    pixValor: valor.original,
                    pixDate: calendario.criacao,
                    pixExpiracaoEmSegundos: calendario.expiracao
                }
            });
            return updatedDonation;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.updateDonationPix = updateDonationPix;
