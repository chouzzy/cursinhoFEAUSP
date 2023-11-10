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
exports.ErrorValidation = exports.checkQuery = void 0;
const yup_1 = require("yup");
const ListAdminsSchema_1 = require("./ListAdminsSchema");
function checkQuery(adminsQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ListAdminsSchema_1.listAdminsSchema.validate(adminsQuery, {
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
function ErrorValidation(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        function checkIfIsAError(admin) {
            return 'isValid' in admin;
        }
        if (checkIfIsAError(admin)) {
            //É um erro
            return admin;
        }
        else {
            //Não é um erro
            if (admin.length == 0) {
                return {
                    isValid: false,
                    statusCode: 404,
                    errorMessage: 'Não foi encontrado nenhum admnistrador.'
                };
            }
            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Não foi encontrado nenhum tipo de erro.'
            };
        }
    });
}
exports.ErrorValidation = ErrorValidation;
