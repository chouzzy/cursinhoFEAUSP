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
exports.CreateStudentController = void 0;
const CreateStudentUseCase_1 = require("./CreateStudentUseCase");
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
class CreateStudentController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const studentData = req.body;
            // const { token } = studentData
            try {
                // const decryptedPaymentMethodString = crypto.AES.decrypt(token, process.env.PCRYPTO_PKEY ?? 'vasco').toString(crypto.enc.Utf8);
                // const paymentMethodID = decryptedPaymentMethodString
                /// instanciação da classe do caso de uso
                const studentsRepository = new StudentsRepository_1.StudentsRepository();
                const createStudentUseCase = new CreateStudentUseCase_1.CreateStudentUseCase(studentsRepository);
                // studentData.paymentMethodID = paymentMethodID
                // studentData.paymentMethodID = 'pm_1OmLGuHkzIzO4aMOoxSTDivn'
                const response = yield createStudentUseCase.execute(studentData);
                return res.status(response.statusCode).json({ response });
            }
            catch (error) {
                return res.status(403).json({ error: error });
            }
        });
    }
}
exports.CreateStudentController = CreateStudentController;
