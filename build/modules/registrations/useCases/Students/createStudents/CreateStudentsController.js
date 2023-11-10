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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateStudentController = void 0;
const CreateStudentUseCase_1 = require("./CreateStudentUseCase");
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
const crypto_js_1 = __importDefault(require("crypto-js"));
class CreateStudentController {
    handle(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const studentData = req.body;
            const { token } = studentData;
            const decryptedPaymentMethodString = crypto_js_1.default.AES.decrypt(token, (_a = process.env.PCRYPTO_PKEY) !== null && _a !== void 0 ? _a : '').toString(crypto_js_1.default.enc.Utf8);
            const paymentMethodID = decryptedPaymentMethodString;
            /// instanciação da classe do caso de uso
            const studentsRepository = new StudentsRepository_1.StudentsRepository();
            const createStudentUseCase = new CreateStudentUseCase_1.CreateStudentUseCase(studentsRepository);
            studentData.paymentMethodID = paymentMethodID;
            const response = yield createStudentUseCase.execute(studentData);
            return res.status(response.statusCode).json({ response });
        });
    }
}
exports.CreateStudentController = CreateStudentController;
