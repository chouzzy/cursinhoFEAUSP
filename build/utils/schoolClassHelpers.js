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
exports.updatePrismaSchoolClass = exports.getPrismaSchoolClass = void 0;
const prisma_1 = require("../prisma");
function getPrismaSchoolClass(schoolClassID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schoolClass = yield prisma_1.prisma.schoolClass.findUnique({
                where: {
                    id: schoolClassID
                }
            });
            if (!schoolClass) {
                throw Error("Turma não encontrada.");
            }
            return schoolClass;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.getPrismaSchoolClass = getPrismaSchoolClass;
function updatePrismaSchoolClass(schoolClassData, schoolClass, schoolClassID) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { selectiveStages, documents, subscriptions, informations, registrations } = schoolClassData;
            const data = {
                title: (_a = schoolClassData.title) !== null && _a !== void 0 ? _a : schoolClass.title,
                status: (_b = schoolClassData.status) !== null && _b !== void 0 ? _b : schoolClass.status,
            };
            // Adiciona informations ao data apenas se ele for definido
            if (registrations) {
                data.registrations = {
                    update: {
                        description: (_c = registrations.description) !== null && _c !== void 0 ? _c : schoolClass.registrations.description,
                        value: (_d = registrations.value) !== null && _d !== void 0 ? _d : schoolClass.registrations.value,
                    }
                };
            }
            if (informations) {
                data.informations = {
                    update: {
                        description: (_e = informations.description) !== null && _e !== void 0 ? _e : schoolClass.informations.description,
                        whoCanParticipate: (_f = informations.whoCanParticipate) !== null && _f !== void 0 ? _f : schoolClass.informations.whoCanParticipate,
                        observations: (_g = informations.observations) !== null && _g !== void 0 ? _g : schoolClass.informations.observations,
                        classContent: (_h = informations.classContent) !== null && _h !== void 0 ? _h : schoolClass.informations.classContent,
                        dateSchedule: (_j = informations.dateSchedule) !== null && _j !== void 0 ? _j : schoolClass.informations.dateSchedule,
                        hourSchedule: (_k = informations.hourSchedule) !== null && _k !== void 0 ? _k : schoolClass.informations.hourSchedule,
                        color: (_l = informations.color) !== null && _l !== void 0 ? _l : schoolClass.informations.color,
                    }
                };
            }
            if (subscriptions) {
                data.subscriptions = {
                    update: {
                        status: subscriptions.status,
                        price: schoolClass.subscriptions.price,
                        subscriptionSchedule: subscriptions.subscriptionSchedule
                    }
                };
            }
            if (selectiveStages) {
                data.selectiveStages = {
                    updateMany: {
                        where: { stagesID: selectiveStages.stagesID },
                        data: selectiveStages
                    }
                };
            }
            // Adiciona documents ao data apenas se ele for definido
            if (documents) {
                data.documents = {
                    updateMany: {
                        where: { docsID: documents.docsID },
                        data: documents
                    }
                };
            }
            const updatedSchoolClass = yield prisma_1.prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: data // Usa o objeto data construído dinamicamente
            });
            if (!updatedSchoolClass) {
                throw Error("Turma não encontrada.");
            }
            return updatedSchoolClass;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.updatePrismaSchoolClass = updatePrismaSchoolClass;
