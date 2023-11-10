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
exports.SyncStudentsController = void 0;
const SyncStudentsUseCase_1 = require("./SyncStudentsUseCase");
const StudentsRepository_1 = require("../../../repositories/implementations/StudentsRepository");
class SyncStudentsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Instanciando o useCase no repositório com as funções
            const donationsRepository = new StudentsRepository_1.StudentsRepository();
            const syncStudentsUseCase = new SyncStudentsUseCase_1.SyncStudentsUseCase(donationsRepository);
            const response = yield syncStudentsUseCase.execute();
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.SyncStudentsController = SyncStudentsController;
