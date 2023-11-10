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
exports.UpdateAdminsController = void 0;
const AdminsRepository_1 = require("../../../repositories/implementations/AdminsRepository");
const UpdateAdminsUseCase_1 = require("./UpdateAdminsUseCase");
class UpdateAdminsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminData = req.body;
            const { adminID } = req.params;
            /// instanciação da classe do caso de uso
            const adminsRepository = new AdminsRepository_1.AdminsRepository();
            const updateAdminsUseCase = new UpdateAdminsUseCase_1.UpdateAdminsUseCase(adminsRepository);
            const response = yield updateAdminsUseCase.execute(adminData, adminID);
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.UpdateAdminsController = UpdateAdminsController;
