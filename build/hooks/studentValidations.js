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
exports.getSchoolClassPrice = exports.createStudentPix = exports.updateStudentPix = exports.getEfiCredentials = exports.getStudentByCPForRG = exports.checkIfPixIsExpired = exports.checkIfPixAlreadyConcluded = void 0;
const prisma_1 = require("../prisma");
function checkIfPixAlreadyConcluded(searchedStudent, studentData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // CHECA SE O ESTUDANTE JÁ SE INSCREVEU E CONCLUIU O PAGAMENTO
            const studentAlreadySubscribed = yield prisma_1.prisma.students.findFirst({
                where: {
                    id: searchedStudent.id,
                    purcharsedSubscriptions: {
                        some: {
                            AND: [
                                { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                                { paymentStatus: 'CONCLUIDA' }
                            ]
                        }
                    }
                }
            });
            // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA, caso contrario, continua
            if (studentAlreadySubscribed) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            throw error;
        }
    });
}
exports.checkIfPixAlreadyConcluded = checkIfPixAlreadyConcluded;
function checkIfPixIsExpired(searchedStudent, studentData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const studentAlreadySubscribedNotConcluded = yield prisma_1.prisma.students.findFirst({
                where: {
                    id: searchedStudent.id,
                    purcharsedSubscriptions: {
                        some: {
                            AND: [
                                { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                                { paymentStatus: 'ATIVA' }
                            ]
                        }
                    }
                }
            });
            if (studentAlreadySubscribedNotConcluded) {
                // CASO O PIX AINDA ESTEJA VÁLIDO
                const isExpired = studentAlreadySubscribedNotConcluded.purcharsedSubscriptions.some((sub) => {
                    // Verifica se a assinatura pertence à mesma turma e se a data de expiração já passou
                    if (sub.schoolClassID === studentData.purcharsedSubscriptions.schoolClassID) {
                        if (sub.pixDate == null || sub.pixExpiracaoEmSegundos == null) {
                            return false;
                        }
                        else {
                            const expirationDate = new Date(sub.pixDate);
                            expirationDate.setSeconds(expirationDate.getSeconds() + sub.pixExpiracaoEmSegundos);
                            return expirationDate < new Date();
                        }
                    }
                });
                return isExpired;
            }
            return true;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.checkIfPixIsExpired = checkIfPixIsExpired;
function getStudentByCPForRG(cpf, rg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const searchedStudent = yield prisma_1.prisma.students.findFirst({
                where: {
                    OR: [
                        { cpf: cpf },
                        { rg: rg }
                    ]
                }
            });
            return searchedStudent;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.getStudentByCPForRG = getStudentByCPForRG;
function getEfiCredentials() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64');
            return credentials;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.getEfiCredentials = getEfiCredentials;
function updateStudentPix(pixData, searchedStudent, studentData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const updatedStudent = yield prisma_1.prisma.students.update({
                where: {
                    id: searchedStudent.id,
                },
                data: {
                    purcharsedSubscriptions: {
                        updateMany: {
                            where: { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                            data: {
                                paymentMethod: "PIX",
                                paymentStatus: "ATIVA",
                                paymentDate: new Date(),
                                valuePaid: 0,
                                txid: pixData.txid,
                                pixCopiaECola: pixData.pixCopiaECola,
                                pixQrCode: pixData.location,
                                pixStatus: pixData.status,
                                pixValor: pixData.valor.original,
                                pixDate: pixData.calendario.criacao,
                                pixExpiracaoEmSegundos: 180,
                            }
                        }
                    }
                }
            });
            return updatedStudent;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.updateStudentPix = updateStudentPix;
function createStudentPix(studentData, pixData) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const createdStudent = yield prisma_1.prisma.students.create({
                data: {
                    name: studentData.name,
                    email: studentData.email,
                    gender: (_a = studentData.gender) !== null && _a !== void 0 ? _a : 'Não informado',
                    birth: studentData.birth,
                    phoneNumber: studentData.phoneNumber,
                    isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                    state: studentData.state,
                    city: studentData.city,
                    street: studentData.street,
                    homeNumber: studentData.homeNumber,
                    complement: (_b = studentData.complement) !== null && _b !== void 0 ? _b : 'Não informado',
                    district: studentData.district,
                    zipCode: studentData.zipCode,
                    cpf: studentData.cpf,
                    rg: studentData.rg,
                    ufrg: studentData.ufrg,
                    selfDeclaration: studentData.selfDeclaration,
                    oldSchool: studentData.oldSchool,
                    oldSchoolAdress: studentData.oldSchoolAdress,
                    highSchoolGraduationDate: studentData.highSchoolGraduationDate,
                    highSchoolPeriod: studentData.highSchoolPeriod,
                    metUsMethod: studentData.metUsMethod,
                    exStudent: studentData.exStudent,
                    stripeCustomerID: "",
                    purcharsedSubscriptions: {
                        schoolClassID: studentData.purcharsedSubscriptions.schoolClassID,
                        paymentMethod: "PIX",
                        paymentStatus: "ATIVA",
                        paymentDate: new Date(),
                        valuePaid: 0,
                        txid: pixData.txid,
                        pixCopiaECola: pixData.pixCopiaECola,
                        pixQrCode: pixData.location,
                        pixStatus: pixData.status,
                        pixValor: pixData.valor.original,
                        pixDate: pixData.calendario.criacao,
                        pixExpiracaoEmSegundos: 180,
                    }
                }
            });
            return createdStudent;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.createStudentPix = createStudentPix;
function getSchoolClassPrice(schoolClassID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                where: {
                    id: schoolClassID
                }
            });
            if (!schoolClass) {
                return 'NOT FOUND';
            }
            if (schoolClass.subscriptions.status === process.env.SCHOOLCLASS_STATUS_FECHADO) {
                return 'CLOSED';
            }
            if (schoolClass.status === process.env.SCHOOLCLASS_STATUS_TURMA_INATIVA) {
                return 'INACTIVE';
            }
            if (schoolClass.subscriptions.status === process.env.SCHOOLCLASS_STATUS_ABERTO &&
                schoolClass.status === process.env.SCHOOLCLASS_STATUS_TURMA_ATIVA) {
                return schoolClass.subscriptions.price;
            }
            return undefined;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.getSchoolClassPrice = getSchoolClassPrice;
