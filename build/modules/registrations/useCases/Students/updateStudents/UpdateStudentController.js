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
exports.UpdateStudentController = void 0;
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
const UpdateStudentUseCase_1 = require("./UpdateStudentUseCase");
class UpdateStudentController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const studentData = req.body;
            const { studentID } = req.params;
            /// instanciação da classe do caso de uso
            const studentsRepository = new StudentsRepository_1.StudentsRepository();
            const updateStudentUseCase = new UpdateStudentUseCase_1.UpdateStudentUseCase(studentsRepository);
            const response = yield updateStudentUseCase.execute(studentData, studentID);
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.UpdateStudentController = UpdateStudentController;
