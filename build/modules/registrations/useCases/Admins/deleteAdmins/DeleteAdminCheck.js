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
exports.ErrorValidation = void 0;
function ErrorValidation(createdAdmin) {
    return __awaiter(this, void 0, void 0, function* () {
        function checkIfIsAError(createdAdmin) {
            return 'isValid' in createdAdmin;
        }
        if (checkIfIsAError(createdAdmin)) {
            //É um erro
            return createdAdmin;
        }
        else {
            // não é um erro
            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Não foi encontrado nenhum tipo de erro.'
            };
        }
    });
}
exports.ErrorValidation = ErrorValidation;
