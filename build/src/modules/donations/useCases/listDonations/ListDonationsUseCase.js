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
exports.ListDonationsUseCase = void 0;
const ListDonationsCheck_1 = require("./ListDonationsCheck");
//////
class ListDonationsUseCase {
    constructor(donationsRepository) {
        this.donationsRepository = donationsRepository;
    }
    execute(donationsRequest) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            //Checando query
            if (!donationsRequest.cpf) {
                donationsRequest.cpf = 'Não informado';
            }
            const queryValidation = yield (0, ListDonationsCheck_1.checkQuery)(donationsRequest);
            if (donationsRequest.cpf === 'Não informado') {
                donationsRequest.cpf = undefined;
            }
            if (queryValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: queryValidation.errorMessage,
                });
            }
            (_a = donationsRequest.page) !== null && _a !== void 0 ? _a : (donationsRequest.page = 0);
            (_b = donationsRequest.pageRange) !== null && _b !== void 0 ? _b : (donationsRequest.pageRange = 10);
            (_c = donationsRequest.initValue) !== null && _c !== void 0 ? _c : (donationsRequest.initValue = -99999999999);
            (_d = donationsRequest.endValue) !== null && _d !== void 0 ? _d : (donationsRequest.endValue = 99999999999);
            (_e = donationsRequest.initDate) !== null && _e !== void 0 ? _e : (donationsRequest.initDate = '1979-01-01');
            (_f = donationsRequest.endDate) !== null && _f !== void 0 ? _f : (donationsRequest.endDate = '2999-01-01');
            let { page, pageRange, initValue, endValue } = donationsRequest;
            // Convertendo valores para números
            const validatedPage = parseInt(page, 10);
            if (isNaN(validatedPage)) {
                return ({
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "Page must be a number",
                });
            }
            const validatedPageRange = parseInt(pageRange, 10);
            if (isNaN(validatedPageRange)) {
                return ({
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "Page range must be a number",
                });
            }
            const validatedInitValue = parseInt(initValue, 10);
            if (isNaN(validatedInitValue)) {
                return ({
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "Init value must be a number",
                });
            }
            const validatedEndValue = parseInt(endValue, 10);
            if (isNaN(validatedEndValue)) {
                return ({
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "End value must be a number",
                });
            }
            page = validatedPage;
            pageRange = validatedPageRange;
            donationsRequest.initValue = validatedInitValue;
            donationsRequest.endValue = validatedEndValue;
            const donations = yield this.donationsRepository.filterDonation(donationsRequest, page, pageRange);
            return donations;
        });
    }
}
exports.ListDonationsUseCase = ListDonationsUseCase;
