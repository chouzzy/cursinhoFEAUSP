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
exports.CreatePixStudentController = void 0;
const CreatePixStudentUseCase_1 = require("./CreatePixStudentUseCase");
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
class CreatePixStudentController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const studentData = req.body;
                /// instanciação da classe do caso de uso
                const studentsRepository = new StudentsRepository_1.StudentsRepository();
                const createStudentUseCase = new CreatePixStudentUseCase_1.CreateStudentUseCase(studentsRepository);
                // studentData.paymentMethodID = 'pm_1OmLGuHkzIzO4aMOoxSTDivn'
                const response = yield createStudentUseCase.execute(studentData);
                return res.status(response.statusCode).json({ response });
            }
            catch (error) {
                return res.status(403).json({ error });
            }
        });
    }
}
exports.CreatePixStudentController = CreatePixStudentController;
