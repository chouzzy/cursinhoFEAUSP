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
exports.ExcelListStudentsController = void 0;
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
const ExcelListStudentsUseCase_1 = require("./ExcelListStudentsUseCase");
class ExcelListStudentsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = req.query;
            // Instanciando o useCase no repositório com as funções
            const studentsRepository = new StudentsRepository_1.StudentsRepository();
            const excelListStudentsUseCase = new ExcelListStudentsUseCase_1.ExcelListStudentsUseCase(studentsRepository);
            const response = yield excelListStudentsUseCase.execute(query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
            // Send the file buffer as the response
            return res.status(response.statusCode).send(response.fileBuffer);
        });
    }
}
exports.ExcelListStudentsController = ExcelListStudentsController;
