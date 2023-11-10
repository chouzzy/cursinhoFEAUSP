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
exports.AdminsRepository = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const prisma_1 = require("../../../../prisma");
const GenerateRefreshToken_1 = require("../../provider/GenerateRefreshToken");
const GenerateTokenProvider_1 = require("../../provider/GenerateTokenProvider");
class AdminsRepository {
    constructor() {
        this.admins = [];
    }
    filterAdmins(id, name, email, username, page, pageRange) {
        return __awaiter(this, void 0, void 0, function* () {
            // Função do prisma para buscar todos os admins
            try {
                if (page == 0) {
                    page = 1;
                }
                const admins = yield prisma_1.prisma.admins.findMany({
                    where: {
                        AND: [
                            { id: id },
                            { name: name },
                            { email: email },
                            { username: username },
                        ],
                    },
                    skip: (page - 1) * pageRange,
                    take: pageRange,
                });
                //Tentativa de redução de tempo na requisição //aumentou 100ms na requisição do banco
                const adminsSimplified = admins.map((admin => {
                    return {
                        id: admin.id,
                        name: admin.name,
                        username: admin.username,
                    };
                }));
                return {
                    isValid: true,
                    statusCode: 202,
                    adminsListSimplified: adminsSimplified,
                    totalDocuments: admins.length
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    createAdmin(adminData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //busca usuario no banco pra ve se existe
                const searchedAdmin = yield prisma_1.prisma.admins.findMany({
                    where: {
                        OR: [
                            { email: adminData.email },
                            { username: adminData.username },
                        ],
                    },
                });
                //Checa se email e usuario ja existem
                if (searchedAdmin.length > 0) {
                    if (searchedAdmin[0].email == adminData.email && searchedAdmin[0].username == adminData.username) {
                        return { isValid: false, errorMessage: `E-mail e nome de usuário já existem `, statusCode: 403 };
                    }
                    if (searchedAdmin[0].email == adminData.email) {
                        return { isValid: false, errorMessage: `🛑 E-mail já existente 🛑`, statusCode: 403 };
                    }
                    if (searchedAdmin[0].username == adminData.username) {
                        return { isValid: false, errorMessage: `🛑 Nome de usuário já existente 🛑`, statusCode: 403 };
                    }
                }
                const passwordHash = yield (0, bcryptjs_1.hash)(adminData.password, 8);
                const createAdmin = yield prisma_1.prisma.admins.create({
                    data: {
                        name: adminData.name,
                        email: (_a = adminData.email) !== null && _a !== void 0 ? _a : '',
                        username: adminData.username,
                        password: passwordHash,
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    admins: {
                        id: createAdmin.id,
                        name: createAdmin.name,
                        email: createAdmin.email,
                        username: createAdmin.username
                    },
                    successMessage: 'Admnistrador criado com sucesso.'
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    updateAdmin(adminData, adminID) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield prisma_1.prisma.admins.findUnique({
                    where: {
                        id: adminID
                    }
                });
                if (admin == null) {
                    return { isValid: false, errorMessage: '🛑 Admin not found 🛑', statusCode: 403 };
                }
                const updatedAdmin = yield prisma_1.prisma.admins.update({
                    where: {
                        id: adminID
                    },
                    data: {
                        name: (_a = adminData.name) !== null && _a !== void 0 ? _a : admin.name,
                        email: (_b = adminData.email) !== null && _b !== void 0 ? _b : admin.email,
                        username: (_c = adminData.username) !== null && _c !== void 0 ? _c : admin.username,
                    }
                });
                const adminSimplified = {
                    id: updatedAdmin.id,
                    name: updatedAdmin.name,
                    username: updatedAdmin.username
                };
                return {
                    isValid: true,
                    statusCode: 202,
                    adminSimplified: adminSimplified,
                    successMessage: 'Administrador atualizado com sucesso.'
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    updateAdminPassword(adminData, adminID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield prisma_1.prisma.admins.findUnique({
                    where: {
                        id: adminID,
                    },
                });
                if (admin == null) {
                    return { isValid: false, errorMessage: 'Administrador não encontrado.', statusCode: 403 };
                }
                const passwordHash = yield (0, bcryptjs_1.hash)(adminData.password, 8);
                //Checando se o a nova senha é igual a antiga
                const passwordMatch = yield (0, bcryptjs_1.compare)(adminData.password, admin.password);
                if (passwordMatch) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: 'A nova senha não pode ser igual a anterior.'
                    };
                }
                const updatedAdmin = yield prisma_1.prisma.admins.update({
                    where: {
                        id: adminID
                    },
                    data: {
                        password: passwordHash,
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    successMessage: 'Senha alterada com sucesso.'
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    deleteAdmin(adminID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const admin = yield prisma_1.prisma.admins.findUnique({
                    where: {
                        id: adminID
                    }
                });
                if (admin) {
                    try {
                        yield prisma_1.prisma.admins.delete({
                            where: {
                                id: adminID
                            }
                        });
                        return {
                            isValid: true,
                            statusCode: 202,
                            admins: admin
                        };
                    }
                    catch (_a) {
                        return {
                            isValid: false,
                            statusCode: 403,
                            errorMessage: "Ocorreu um erro ao tentar deletar o administrador"
                        };
                    }
                }
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Administrador não encontrado no banco de dados."
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    authenticateAdmin({ username, password }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Buscando o admin
                const adminFound = yield prisma_1.prisma.admins.findFirst({
                    where: {
                        username: username
                    }
                });
                //Checando se o username está correto
                if (!adminFound) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Usuário ou senha incorretos."
                    };
                }
                //Checando se o password está correto
                const passwordMatch = yield (0, bcryptjs_1.compare)(password, adminFound.password);
                if (!passwordMatch) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Usuário ou senha incorretos."
                    };
                }
                // Gerando o Token
                const generateTokenProvider = new GenerateTokenProvider_1.GenerateTokenProvider();
                const token = yield generateTokenProvider.execute(adminFound.id);
                //Gerando refresh token
                const generateRefreshToken = new GenerateRefreshToken_1.GenerateRefreshToken();
                const newRefreshToken = yield generateRefreshToken.execute(adminFound.id);
                return {
                    isValid: true,
                    token: token,
                    refreshToken: newRefreshToken.id,
                    admins: {
                        id: adminFound.id,
                        name: adminFound.name,
                        username: adminFound.username,
                        email: adminFound.email
                    }, statusCode: 202
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
}
exports.AdminsRepository = AdminsRepository;
