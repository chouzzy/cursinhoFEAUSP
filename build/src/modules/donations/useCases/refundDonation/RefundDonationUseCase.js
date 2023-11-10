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
exports.RefundDonationUseCase = void 0;
const RefundDonationCheck_1 = require("./RefundDonationCheck");
class RefundDonationUseCase {
    constructor(donationsRepository) {
        this.donationsRepository = donationsRepository;
    }
    execute(donationID, chargeID) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyValidation = yield (0, RefundDonationCheck_1.checkBody)(donationID, chargeID);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const refundDonation = yield this.donationsRepository.refundDonation(donationID, chargeID);
            return refundDonation;
        });
    }
}
exports.RefundDonationUseCase = RefundDonationUseCase;
