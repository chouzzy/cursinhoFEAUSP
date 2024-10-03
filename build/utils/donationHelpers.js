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
exports.updateDonationBought = exports.createPrismaDonation = exports.getStripeProduct = exports.updateDonationPix = exports.createDonationPix = void 0;
const prisma_1 = require("../prisma");
const server_1 = require("../server");
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
function getStripeProduct(stripeProductID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const product = yield server_1.stripe.products.retrieve(stripeProductID);
            if (!product) {
                throw Error("Produto não encontrado no Stripe");
            }
            const { default_price } = product;
            if (default_price && typeof (default_price) === 'string') {
                const price = yield server_1.stripe.prices.retrieve(default_price);
                if (!price.unit_amount) {
                    throw Error("Produto sem preço cadastrado");
                }
                const response = {
                    price,
                    product,
                    unit_amount: price.unit_amount
                };
                return response;
            }
            throw Error("Produto ou preço não encontrado");
        }
        catch (error) {
            throw error;
        }
    });
}
exports.getStripeProduct = getStripeProduct;
function createPrismaDonation(donationData, unit_amount) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //Criando a donation no banco de dados
            const createdDonation = yield prisma_1.prisma.donations.create({
                data: {
                    name: donationData.name,
                    email: donationData.email,
                    phoneNumber: donationData.phoneNumber,
                    isPhoneWhatsapp: donationData.isPhoneWhatsapp,
                    gender: (_a = donationData.gender) !== null && _a !== void 0 ? _a : 'NDA',
                    birth: donationData.birth,
                    state: donationData.state,
                    city: donationData.city,
                    street: donationData.street,
                    homeNumber: donationData.homeNumber,
                    complement: (_b = donationData.complement) !== null && _b !== void 0 ? _b : 'NDA',
                    district: donationData.district,
                    zipCode: donationData.zipCode,
                    cpf: (_c = donationData.cpf) !== null && _c !== void 0 ? _c : 'NDA',
                    rg: (_d = donationData.rg) !== null && _d !== void 0 ? _d : 'NDA',
                    cnpj: (_e = donationData.cnpj) !== null && _e !== void 0 ? _e : 'NDA',
                    ufrg: (_f = donationData.ufrg) !== null && _f !== void 0 ? _f : 'NDA',
                    valuePaid: 0,
                    paymentDate: new Date(),
                    paymentMethod: 'card',
                    paymentStatus: 'Em processamento',
                    stripeCustomerID: 'NDA',
                    stripeSubscriptionID: 'NDA',
                    ciclePaid: 0,
                    ciclesBought: donationData.cycles,
                    valueBought: unit_amount,
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
exports.createPrismaDonation = createPrismaDonation;
function updateDonationBought(createdDonation, stripeSubscription, stripeCustomerID, unit_amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { current_period_end, status, start_date, id } = stripeSubscription;
            let { cancel_at } = stripeSubscription;
            // const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price
            if (!cancel_at) {
                cancel_at = current_period_end;
            }
            // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
            const cancelAtDate = new Date(cancel_at * 1000).getTime();
            const startAtDate = new Date(start_date * 1000).getTime();
            const totalPaymentsBought = Math.floor(((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30))) - 1;
            const donationUpdated = yield prisma_1.prisma.donations.update({
                where: { id: createdDonation.id },
                data: {
                    stripeCustomerID: stripeCustomerID,
                    stripeSubscriptionID: id,
                    paymentMethod: 'card',
                    paymentStatus: status,
                    paymentDate: new Date(start_date * 1000),
                    donationExpirationDate: cancel_at ? new Date(cancel_at * 1000) : '',
                    ciclePaid: 1,
                    ciclesBought: totalPaymentsBought == 0 ? 1 : totalPaymentsBought,
                    valueBought: unit_amount * (totalPaymentsBought),
                    valuePaid: unit_amount
                }
            });
            return donationUpdated;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.updateDonationBought = updateDonationBought;
