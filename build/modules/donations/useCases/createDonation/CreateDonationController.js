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
exports.CreateDonationController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const CreateDonationUseCase_1 = require("./CreateDonationUseCase");
class CreateDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const donationData = req.body;
            const { paymentMethodID } = donationData;
            if (!paymentMethodID) {
                return res.status(403).send({ message: 'Token inválido' });
            }
            try {
                // const decryptedPaymentMethodString = crypto.AES.decrypt(paymentMethodID, process.env.CRYPTO_PKEY?? '').toString(crypto.enc.Utf8);
                // if (!decryptedPaymentMethodString) {
                //     return res.status(403).send({message:'Token inválido'}) 
                // }
                // donationData.paymentMethodID =  decryptedPaymentMethodString
                const donationsRepository = new DonationsRepository_1.DonationsRepository();
                const createDonationUseCase = new CreateDonationUseCase_1.CreateDonationUseCase(donationsRepository);
                const response = yield createDonationUseCase.execute(donationData);
                return res.status(response.statusCode).json({ response });
            }
            catch (error) {
                return res.status(403).send({ message: String(error) });
            }
        });
    }
}
exports.CreateDonationController = CreateDonationController;
