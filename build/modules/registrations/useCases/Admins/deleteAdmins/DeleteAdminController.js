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
exports.DeleteAdminController = void 0;
const AdminsRepository_1 = require("../../../repositories/implementations/AdminsRepository");
const DeleteAdminUseCase_1 = require("./DeleteAdminUseCase");
class DeleteAdminController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminID = req.params.adminID;
            const adminsRepository = new AdminsRepository_1.AdminsRepository();
            const deleteAdminUseCase = new DeleteAdminUseCase_1.DeleteAdminUseCase(adminsRepository);
            const response = yield deleteAdminUseCase.execute(adminID);
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.DeleteAdminController = DeleteAdminController;
