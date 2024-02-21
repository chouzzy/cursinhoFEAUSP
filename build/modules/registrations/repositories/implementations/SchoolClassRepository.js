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
exports.SchoolClassRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../../prisma");
const StripeProducts_1 = require("../../../../hooks/StripeProducts");
const uuid_1 = require("uuid");
const server_1 = require("../../../../server");
class SchoolClassRepository {
    constructor() {
        this.SchoolClass = [];
    }
    createSchoolClass(schoolClassData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //busca usuario no banco pra ve se existe
                const schoolClassFound = yield prisma_1.prisma.schoolClass.findFirst({
                    where: {
                        OR: [
                            { title: schoolClassData.title },
                        ],
                    },
                });
                if (schoolClassFound) {
                    return { isValid: false, errorMessage: `Título de turma já existente`, statusCode: 403 };
                }
                (_a = schoolClassData.documents) === null || _a === void 0 ? void 0 : _a.map(doc => {
                    doc.docsID = (0, uuid_1.v4)();
                });
                schoolClassData.selectiveStages.map(stage => {
                    stage.stagesID = (0, uuid_1.v4)();
                });
                const createdSchoolClass = yield prisma_1.prisma.schoolClass.create({
                    data: schoolClassData
                });
                return { isValid: true, statusCode: 202, schoolClass: createdSchoolClass };
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
    listAllSchoolClasses(title) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allSchoolClasses = yield prisma_1.prisma.schoolClass.findMany({
                    where: {
                        OR: [
                            { title: { contains: title } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    listAllSchoolClassList: allSchoolClasses !== null && allSchoolClasses !== void 0 ? allSchoolClasses : []
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
    listSchoolClasses(page, pageRange, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (page == 0) {
                    page = 1;
                }
                if (status != 'all') {
                    const allSchoolClasses = yield prisma_1.prisma.schoolClass.findMany({
                        where: {
                            status: status
                        }
                    });
                    return {
                        isValid: true,
                        statusCode: 202,
                        schoolClassList: allSchoolClasses,
                        totalDocuments: allSchoolClasses.length
                    };
                }
                const allSchoolClasses = yield prisma_1.prisma.schoolClass.findMany({
                    where: {
                        status: undefined
                    },
                    skip: (page - 1) * pageRange,
                    take: pageRange
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    schoolClassList: allSchoolClasses,
                    totalDocuments: allSchoolClasses.length
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
    updateSchoolClass(schoolClassData, schoolClassID, stripeProductID //enviado apenas na criação de um schoolClass, nunca num update
    ) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('dentro do update schoolClass')
            // console.log('schoolClassData')
            // console.log(schoolClassData)
            // console.log('schoolClassID')
            // console.log(schoolClassID)
            // console.log('stripeProductID')
            // console.log(stripeProductID)
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findUnique({
                    where: {
                        id: schoolClassID
                    }
                });
                if (!schoolClass) {
                    return { isValid: false, errorMessage: 'Turma não encontrada.', statusCode: 403 };
                }
                //Se tiver o product ID, iremos atualizá-lo, pois se trata de um update do webhook
                if (stripeProductID) {
                    const newDefaultPrice = schoolClass.subscriptions.price;
                    if (!newDefaultPrice) {
                        const updatedSchoolClass = yield prisma_1.prisma.schoolClass.update({
                            where: {
                                id: schoolClassID
                            },
                            data: {
                                stripeProductID: stripeProductID !== null && stripeProductID !== void 0 ? stripeProductID : schoolClass.stripeProductID
                            }
                        });
                        return {
                            isValid: true,
                            statusCode: 202,
                            successMessage: 'Turma criada no servidor Stripe e atualizada com sucesso no banco de dados.',
                            schoolClass: updatedSchoolClass
                        };
                    }
                    const stripeProduct = yield server_1.stripe.products.retrieve(stripeProductID);
                    // console.log('stripeProduct')
                    // console.log(stripeProduct)
                    const { default_price } = stripeProduct;
                    if (!default_price || typeof (default_price) != 'string') {
                        return {
                            isValid: false,
                            errorMessage: 'Não foi possível encontrar o preço antigo do produto',
                            statusCode: 403
                        };
                    }
                    const price = yield server_1.stripe.prices.create({
                        unit_amount: newDefaultPrice,
                        currency: 'brl',
                        recurring: { interval: 'month' },
                        product: stripeProduct.id,
                    });
                    // console.log('price')
                    // console.log(price)
                    //
                    yield server_1.stripe.products.update(stripeProductID, {
                        default_price: price.id,
                        name: (_a = schoolClassData.title) !== null && _a !== void 0 ? _a : stripeProduct.name,
                        description: (_b = schoolClassData.informations.description) !== null && _b !== void 0 ? _b : stripeProduct.description
                    });
                    const updatedSchoolClass = yield prisma_1.prisma.schoolClass.update({
                        where: {
                            id: schoolClassID
                        },
                        data: {
                            title: (_c = schoolClassData.title) !== null && _c !== void 0 ? _c : schoolClassData.title,
                            informations: (_d = schoolClassData.informations) !== null && _d !== void 0 ? _d : schoolClassData.informations,
                            subscriptions: (_e = schoolClassData.subscriptions) !== null && _e !== void 0 ? _e : schoolClassData.subscriptions,
                            selectiveStages: (_f = schoolClassData.selectiveStages) !== null && _f !== void 0 ? _f : schoolClassData.selectiveStages,
                            status: (_g = schoolClassData.status) !== null && _g !== void 0 ? _g : schoolClassData.status,
                            stripeProductID: (_h = stripeProduct.id) !== null && _h !== void 0 ? _h : stripeProduct.id,
                            documents: (_j = schoolClassData.documents) !== null && _j !== void 0 ? _j : schoolClassData.documents,
                            registrations: (_k = schoolClassData.registrations) !== null && _k !== void 0 ? _k : schoolClassData.registrations
                        }
                    });
                    // console.log('updatedSchoolClass')
                    // console.log(updatedSchoolClass)
                    return {
                        isValid: true,
                        statusCode: 202,
                        successMessage: 'Turma criada no servidor Stripe e atualizada com sucesso no banco de dados.',
                        schoolClass: updatedSchoolClass
                    };
                }
                // Não há atualização de documents e nem de stripe ID, apenas um simples update de outros dados
                const updatedSchoolClass = yield prisma_1.prisma.schoolClass.update({
                    where: {
                        id: schoolClassID
                    },
                    data: {
                        title: (_l = schoolClassData.title) !== null && _l !== void 0 ? _l : schoolClass.title,
                        status: (_m = schoolClassData.status) !== null && _m !== void 0 ? _m : schoolClass.status,
                        documents: (_o = schoolClassData.documents) !== null && _o !== void 0 ? _o : schoolClass.documents,
                        informations: (_p = schoolClassData.informations) !== null && _p !== void 0 ? _p : schoolClass.informations,
                        registrations: (_q = schoolClassData.registrations) !== null && _q !== void 0 ? _q : schoolClass.registrations,
                        selectiveStages: (_r = schoolClassData.selectiveStages) !== null && _r !== void 0 ? _r : schoolClass.selectiveStages,
                        stripeProductID: (_s = schoolClassData.stripeProductID) !== null && _s !== void 0 ? _s : schoolClass.stripeProductID,
                        subscriptions: (_t = schoolClassData.subscriptions) !== null && _t !== void 0 ? _t : schoolClass.subscriptions,
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    successMessage: "Turma atualizada com sucesso",
                    schoolClass: updatedSchoolClass
                };
            }
            catch (error) {
                // console.log('error')
                // console.log(error)
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
    deleteSchoolClass(schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findUnique({
                    where: {
                        id: schoolClassID
                    }
                });
                if (schoolClass) {
                    try {
                        const stripeProducts = new StripeProducts_1.StripeProducts();
                        yield stripeProducts.deleteProduct(schoolClass.stripeProductID);
                        yield prisma_1.prisma.schoolClass.delete({
                            where: {
                                id: schoolClassID
                            }
                        });
                        return {
                            isValid: true,
                            successMessage: 'Estudante deletado com sucesso',
                            statusCode: 202,
                            schoolClass: schoolClass
                        };
                    }
                    catch (_a) {
                        return {
                            isValid: false,
                            statusCode: 403,
                            errorMessage: "Um erro ocorreu ao tentar excluir a turma do banco de dados"
                        };
                    }
                }
                else {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Turma não encontrada no banco de dados"
                    };
                }
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
    createDocs(schoolClassDocsData, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: { id: schoolClassID }
                });
                if (!schoolClass) {
                    return {
                        isValid: false,
                        errorMessage: "Turma não encontrada.",
                        statusCode: 403
                    };
                }
                // Registrating UUID for each document
                const docsWithID = schoolClassDocsData.map(doc => {
                    return {
                        docsID: (0, uuid_1.v4)(),
                        title: doc.title,
                        downloadLink: doc.downloadLink,
                    };
                });
                const documentsReadyToUpdate = [...schoolClass.documents, ...docsWithID];
                //Grouping the documents titles to check if it is duplicated
                const docsTitles = documentsReadyToUpdate.map(doc => {
                    return doc.title;
                });
                // Checking duplicated titles
                const titleAlreadyRegistered = docsTitles.some((item, index) => {
                    return docsTitles.indexOf(item) != index;
                });
                //if duplicated, we'll return false
                if (titleAlreadyRegistered) {
                    return {
                        isValid: false,
                        errorMessage: "Título já existente",
                        statusCode: 403
                    };
                }
                // Updating the documents
                const schoolClassUpdated = yield prisma_1.prisma.schoolClass.update({
                    where: { id: schoolClassID },
                    data: {
                        documents: documentsReadyToUpdate
                    }
                });
                return {
                    isValid: true,
                    successMessage: "Document was successfully registered",
                    statusCode: 201,
                    schoolClassDocs: schoolClassUpdated.documents,
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
    createStages(schoolClassStagesData, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: { id: schoolClassID }
                });
                if (!schoolClass) {
                    return {
                        isValid: false,
                        errorMessage: "Turma não encontrada",
                        statusCode: 403
                    };
                }
                // Registrating UUID for each document
                const stagesWithID = schoolClassStagesData.map(stage => {
                    if (stage.resultsDate != null) {
                        stage.resultsDate = new Date(stage.resultsDate);
                    }
                    return {
                        stagesID: (0, uuid_1.v4)(),
                        when: stage.when,
                        resultsDate: stage.resultsDate,
                        description: stage.description,
                    };
                });
                const stagesToUpdate = [...stagesWithID, ...schoolClass.selectiveStages];
                const schoolClassUpdated = yield prisma_1.prisma.schoolClass.update({
                    where: { id: schoolClassID },
                    data: {
                        selectiveStages: stagesToUpdate
                    }
                });
                return {
                    isValid: true,
                    successMessage: "Documento registrado com sucesso.",
                    statusCode: 201,
                    schoolClassStages: schoolClassUpdated.selectiveStages
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
    deleteDocs(docsID, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: { id: schoolClassID }
                });
                if (!schoolClass) {
                    return {
                        isValid: false,
                        errorMessage: 'Turma não encontrada.',
                        statusCode: 404
                    };
                }
                const docExists = schoolClass.documents.filter((doc) => {
                    return doc.docsID === docsID;
                });
                if (docExists.length == 0) {
                    return {
                        isValid: false,
                        errorMessage: 'Documento não encontrado',
                        statusCode: 404
                    };
                }
                const remainingDocs = schoolClass.documents.filter((doc) => {
                    return doc.docsID != docsID;
                });
                const deletedDoc = yield prisma_1.prisma.schoolClass.update({
                    where: { id: schoolClassID },
                    data: {
                        documents: remainingDocs
                    }
                });
                return {
                    isValid: true,
                    successMessage: 'Documento excluído com sucesso.',
                    statusCode: 201
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
    deleteStages(stagesID, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: { id: schoolClassID }
                });
                if (!schoolClass) {
                    return {
                        isValid: false,
                        errorMessage: 'Turma não encontrada',
                        statusCode: 404
                    };
                }
                const stageExists = schoolClass.selectiveStages.filter((stage) => {
                    return stage.stagesID === stagesID;
                });
                if (stageExists.length == 0) {
                    return {
                        isValid: false,
                        errorMessage: 'Etapa não encontrada',
                        statusCode: 404
                    };
                }
                const remainingStages = schoolClass.selectiveStages.filter((stage) => {
                    return stage.stagesID != stagesID;
                });
                const deletedStage = yield prisma_1.prisma.schoolClass.update({
                    where: { id: schoolClassID },
                    data: {
                        selectiveStages: remainingStages
                    }
                });
                return {
                    isValid: true,
                    successMessage: 'Selective Stage deleted successfully',
                    statusCode: 201
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
exports.SchoolClassRepository = SchoolClassRepository;
