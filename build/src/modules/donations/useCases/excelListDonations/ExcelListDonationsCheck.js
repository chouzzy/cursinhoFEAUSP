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
exports.checkQuery = void 0;
const yup_1 = require("yup");
const ExcelListDonationSchema_1 = require("./ExcelListDonationSchema");
function checkQuery(donationQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ExcelListDonationSchema_1.listDonationSchema.validate(donationQuery, {
                abortEarly: false
            });
        }
        catch (error) {
            if (error instanceof yup_1.ValidationError) {
                return { errorMessage: error.errors, statusCode: 403, isValid: false };
            }
        }
        return { isValid: true, statusCode: 302 };
    });
}
exports.checkQuery = checkQuery;
