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
exports.ErrorValidation = exports.checkBody = void 0;
const yup_1 = require("yup");
const CreateSchoolClassDocsSchema_1 = require("./CreateSchoolClassDocsSchema");
function checkBody(schoolClassDocsData) {
    return __awaiter(this, void 0, void 0, function* () {
        // check body properties
        try {
            const yupValidation = yield CreateSchoolClassDocsSchema_1.createSchoolClassDocsSchema.validate(schoolClassDocsData, {
                abortEarly: false,
            });
            return { isValid: true, statusCode: 202 };
        }
        catch (error) {
            if (error instanceof yup_1.ValidationError) {
                return { errorMessage: error.errors, statusCode: 403, isValid: false };
            }
        }
        return { isValid: true, statusCode: 202 };
    });
}
exports.checkBody = checkBody;
function ErrorValidation(createdSchoolClass) {
    return __awaiter(this, void 0, void 0, function* () {
        function checkIfIsAError(createdSchoolClass) {
            return 'isValid' in createdSchoolClass;
        }
        if (checkIfIsAError(createdSchoolClass)) {
            //É um erro
            return createdSchoolClass;
        }
        else {
            //Não é um erro
            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Não foi encontrado nenhum tipo de erro.'
            };
        }
    });
}
exports.ErrorValidation = ErrorValidation;