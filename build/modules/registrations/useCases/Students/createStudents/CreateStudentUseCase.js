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
exports.CreateStudentUseCase = void 0;
const CreateStudentCheck_1 = require("./CreateStudentCheck");
class CreateStudentUseCase {
    constructor(studentsRepository) {
        this.studentsRepository = studentsRepository;
    }
    execute(studentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { cpf, rg } = studentData;
            // validação que o yup não consegue fazer (um ou outro)
            if (!cpf && !rg) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: 'O CPF ou o RG são obrigatórios.',
                });
            }
            if (!studentData.rg) {
                studentData.ufrg = "NDA";
            }
            const bodyValidation = yield (0, CreateStudentCheck_1.checkBody)(studentData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const createdStudent = yield this.studentsRepository.createStudentPaymentIntent(studentData);
            return createdStudent;
        });
    }
}
exports.CreateStudentUseCase = CreateStudentUseCase;
