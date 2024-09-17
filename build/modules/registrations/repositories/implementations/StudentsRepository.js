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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../../prisma");
const StripeCustomer_1 = require("../../../../hooks/StripeCustomer");
const StripeFakeFront_1 = require("../../../../hooks/StripeFakeFront");
const server_1 = require("../../../../server");
const stripe_1 = __importDefault(require("stripe"));
class StudentsRepository {
    constructor() {
        this.students = [];
    }
    filterStudent({ id, name, email, cpf, paymentStatus, schoolClassID, initDate, endDate }, page, pageRange) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (page == 0) {
                    page = 1;
                }
                let filteredStudents = yield prisma_1.prisma.students.findMany({
                    where: {
                        AND: [
                            { id: id },
                            { name: { contains: name } },
                            { email: email },
                            { cpf: cpf },
                            {
                                purcharsedSubscriptions: {
                                    some: {
                                        schoolClassID: schoolClassID,
                                        paymentStatus: paymentStatus,
                                        paymentDate: {
                                            gte: new Date(initDate),
                                            lte: new Date(endDate)
                                        }
                                    }
                                },
                            },
                        ]
                    },
                    skip: (page - 1) * pageRange,
                    take: pageRange
                });
                // const studentsPerSchoolClass: Students[] = []
                // filteredStudents.map(student => {
                //     const check = student.purcharsedSubscriptions.map(sub => {
                //         if (sub.paymentDate) {
                //             if ((new Date(endDate) > sub.paymentDate) && (sub.paymentDate > new Date(initDate))) {
                //                 return true
                //             }
                //             else {
                //                 return false
                //             }
                //         }
                //     })
                //     if (check.includes(true)) {
                //         studentsPerSchoolClass.push(student)
                //     }
                // })
                // filteredStudents = studentsPerSchoolClass
                // Filtro por turma
                // if (schoolClassID) {
                //     const studentsPerSchoolClass: Students[] = []
                //     filteredStudents.map(student => {
                //         const check = student.purcharsedSubscriptions.map(sub => {
                //             if (sub.schoolClassID == schoolClassID) {
                //                 if (!paymentStatus) {
                //                     return true
                //                 } else if (sub.paymentStatus == paymentStatus) {
                //                     return true
                //                 }
                //             }
                //             return false
                //         })
                //         if (check.includes(true)) {
                //             studentsPerSchoolClass.push(student)
                //         }
                //     })
                //     return {
                //         isValid: true,
                //         statusCode: 202,
                //         studentsList: studentsPerSchoolClass,
                //         totalDocuments: studentsPerSchoolClass.length
                //     }
                // }
                //Filtro apenas por status de pagamento
                // if (paymentStatus && !schoolClassID) {
                //     const studentsPerPaymentStatus: Students[] = []
                //     filteredStudents.map(student => {
                //         student.purcharsedSubscriptions.map(sub => {
                //             if (sub.paymentStatus == paymentStatus) {
                //                 studentsPerPaymentStatus.push(student)
                //             }
                //         })
                //     })
                //     return {
                //         isValid: true,
                //         statusCode: 202,
                //         studentsList: studentsPerPaymentStatus,
                //         totalDocuments: studentsPerPaymentStatus.length
                //     }
                // }
                return {
                    isValid: true,
                    statusCode: 202,
                    studentsList: filteredStudents,
                    totalDocuments: filteredStudents.length
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
    createStudent(studentData) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // CHECA SE A SCHOOLCLASS JÁ FOI COMPRADA
                function checkDuplicateSchoolClassIDs(purcharsedSubscriptions) {
                    const uniqueIDs = new Set();
                    for (const subscription of purcharsedSubscriptions) {
                        if (uniqueIDs.has(subscription.schoolClassID)) {
                            return true; // Duplicate found
                        }
                        uniqueIDs.add(subscription.schoolClassID);
                    }
                    return false; // No duplicates found
                }
                const { purcharsedSubscriptions } = studentData;
                const hasDuplicateSchoolClassIDs = checkDuplicateSchoolClassIDs(purcharsedSubscriptions);
                if (hasDuplicateSchoolClassIDs) {
                    return {
                        isValid: false,
                        errorMessage: `A inscrição já foi comprada anteriormente.`,
                        statusCode: 403
                    };
                }
                // CHECA SE A TURMA EXISTE
                const sutdentDataSchoolClassID = studentData.purcharsedSubscriptions[0].schoolClassID;
                const searchedSchoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: { id: sutdentDataSchoolClassID }
                });
                if (!searchedSchoolClass) {
                    return {
                        isValid: false,
                        errorMessage: `Turma não encontrada.`,
                        statusCode: 403
                    };
                }
                // CHECA SE O ESTUDANTE JÁ TEM ALGUMA INSCRIÇÃO ANTERIOR
                const searchedStudent = yield prisma_1.prisma.students.findFirst({
                    where: {
                        OR: [
                            { cpf: studentData.cpf },
                            { rg: studentData.rg }
                        ]
                    }
                });
                const stripeCustomer = new StripeCustomer_1.StripeCustomer();
                const { cpf, rg } = studentData;
                const stripeSearchedCustomerID = yield stripeCustomer.searchCustomer(cpf, null);
                // CHECA SE JA EXISTE O ESTUDANTE NO STRIPE E NO BANCO
                if (searchedStudent && stripeSearchedCustomerID) {
                    //CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE  E O PAGAMENTO ESTÁ ACTIVE
                    let subscriptionsDuplicated = [];
                    //Filtro para possível cadastro em turma que já foi paga.
                    studentData.purcharsedSubscriptions.map((subscription) => {
                        searchedStudent.purcharsedSubscriptions.map((subscriptionAlreadyRegistered) => {
                            if (subscriptionAlreadyRegistered.schoolClassID == subscription.schoolClassID
                                &&
                                    subscriptionAlreadyRegistered.paymentStatus == "active") {
                                subscriptionsDuplicated.push(subscription.schoolClassID);
                            }
                        });
                    });
                    // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA, caso contrario, continua
                    if (subscriptionsDuplicated.length > 0) {
                        return {
                            isValid: false,
                            errorMessage: `Uma ou mais inscrições já foram compradas pelo estudante.`,
                            subscriptionsDuplicated: subscriptionsDuplicated,
                            statusCode: 403
                        };
                    }
                    // CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE, MAS O PAGAMENTO NÃO FOI APROVADO
                    const isDuplicatedInactiveSubscription = checkDuplicateSchoolClassIDs([
                        ...searchedStudent.purcharsedSubscriptions,
                        ...studentData.purcharsedSubscriptions
                    ]);
                    //TENTANDO EFETUAR O PAGAMENTO NOVAMENTE DA INSCRIÇÃO NÃO APROVADA
                    if (isDuplicatedInactiveSubscription) {
                        const stripeFrontEnd = new StripeFakeFront_1.StripeFakeFront();
                        const stripeResponse = yield stripeFrontEnd.createSubscription({
                            stripeCustomerID: stripeSearchedCustomerID,
                            cpf: cpf,
                            rg: rg,
                            schoolClassID: sutdentDataSchoolClassID,
                            cycles: 1,
                            paymentMethodID: studentData.paymentMethodID,
                            productSelectedID: studentData.productSelectedID
                        });
                        if (!stripeResponse.stripeSubscription) {
                            return stripeResponse;
                        }
                        const { status, start_date, id } = stripeResponse.stripeSubscription;
                        const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price;
                        const { title, stripeProductID } = searchedSchoolClass;
                        searchedStudent.purcharsedSubscriptions.map(subscription => {
                            if (subscription.schoolClassID == sutdentDataSchoolClassID) {
                                subscription.productID = stripeProductID,
                                    subscription.stripeSubscriptionID = id,
                                    subscription.productName = title,
                                    subscription.paymentMethod = 'creditcard',
                                    subscription.paymentStatus = status,
                                    subscription.paymentDate = new Date(start_date * 1000),
                                    subscription.valuePaid = unit_amount !== null && unit_amount !== void 0 ? unit_amount : studentData.purcharsedSubscriptions[0].valuePaid;
                            }
                        });
                        yield prisma_1.prisma.students.update({
                            where: { id: searchedStudent.id },
                            data: {
                                purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions
                            }
                        });
                        return {
                            isValid: true,
                            errorMessage: `Estudante atualizado com sucesso!`,
                            students: searchedStudent,
                            statusCode: 202
                        };
                    }
                    // Só vai chegar aqui a inscrição
                    const stripeFrontEnd2 = new StripeFakeFront_1.StripeFakeFront();
                    const stripeResponse = yield stripeFrontEnd2.createSubscription({
                        stripeCustomerID: stripeSearchedCustomerID,
                        cpf: cpf,
                        rg: rg,
                        schoolClassID: sutdentDataSchoolClassID,
                        cycles: 1,
                        paymentMethodID: studentData.paymentMethodID,
                        productSelectedID: studentData.productSelectedID
                    });
                    if (!stripeResponse.stripeSubscription) {
                        return stripeResponse;
                    }
                    const { status, start_date, id } = stripeResponse.stripeSubscription;
                    const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price;
                    const { title, stripeProductID } = searchedSchoolClass;
                    studentData.purcharsedSubscriptions.map((subscription) => __awaiter(this, void 0, void 0, function* () {
                        if (subscription.schoolClassID == sutdentDataSchoolClassID) {
                            subscription.productID = stripeProductID,
                                subscription.stripeSubscriptionID = id,
                                subscription.productName = title,
                                subscription.paymentMethod = 'creditcard',
                                subscription.paymentStatus = status,
                                subscription.paymentDate = new Date(start_date * 1000),
                                subscription.valuePaid = unit_amount !== null && unit_amount !== void 0 ? unit_amount : studentData.purcharsedSubscriptions[0].valuePaid;
                        }
                    }));
                    const updatedStudent = yield prisma_1.prisma.students.update({
                        where: { id: searchedStudent.id },
                        data: {
                            purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions.concat(studentData.purcharsedSubscriptions)
                        }
                    });
                    const { statusCode, successMessage, isValid } = stripeResponse;
                    return {
                        isValid,
                        successMessage,
                        students: updatedStudent,
                        statusCode
                    };
                }
                // Student não encontrado no banco e no stripe:
                const stripeCustomerCreatedID = yield stripeCustomer.createCustomer(studentData);
                const stripeFrontEnd = new StripeFakeFront_1.StripeFakeFront();
                const stripeResponse = yield stripeFrontEnd.createSubscription({
                    stripeCustomerID: stripeCustomerCreatedID,
                    cpf: cpf,
                    rg: rg,
                    schoolClassID: sutdentDataSchoolClassID,
                    cycles: 1,
                    paymentMethodID: studentData.paymentMethodID,
                    productSelectedID: studentData.productSelectedID
                });
                if (!stripeResponse.isValid) {
                    return {
                        isValid: stripeResponse.isValid,
                        errorMessage: stripeResponse.errorMessage,
                        statusCode: stripeResponse.statusCode
                    };
                }
                if (stripeResponse.stripeSubscription) {
                    const { status, start_date, id } = stripeResponse.stripeSubscription;
                    const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price;
                    const { title, stripeProductID } = searchedSchoolClass;
                    studentData.purcharsedSubscriptions.map((subscription) => __awaiter(this, void 0, void 0, function* () {
                        if (subscription.schoolClassID == sutdentDataSchoolClassID) {
                            subscription.paymentDate = new Date(start_date * 1000),
                                subscription.stripeSubscriptionID = id,
                                subscription.paymentMethod = 'creditcard',
                                subscription.paymentStatus = status,
                                subscription.productID = stripeProductID,
                                subscription.productName = title,
                                subscription.valuePaid = unit_amount !== null && unit_amount !== void 0 ? unit_amount : studentData.purcharsedSubscriptions[0].valuePaid;
                        }
                    }));
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
                            stripeCustomerID: stripeCustomerCreatedID,
                            purcharsedSubscriptions: studentData.purcharsedSubscriptions
                        }
                    });
                    const { statusCode, successMessage, isValid } = stripeResponse;
                    return {
                        isValid,
                        successMessage,
                        students: createdStudent,
                        statusCode
                    };
                }
                //STRIPE RESPONSE DEU ERRO
                let studentSchoolClasses = [];
                studentData.purcharsedSubscriptions.map((subscription) => {
                    var _a, _b, _c, _d, _e, _f;
                    studentSchoolClasses.push({
                        schoolClassID: subscription.schoolClassID,
                        stripeSubscriptionID: subscription.stripeSubscriptionID,
                        paymentDate: (_a = subscription.paymentDate) !== null && _a !== void 0 ? _a : null,
                        paymentMethod: (_b = subscription.paymentMethod) !== null && _b !== void 0 ? _b : 'Pagamento não confirmado',
                        paymentStatus: (_c = subscription.paymentStatus) !== null && _c !== void 0 ? _c : 'Pagamento não confirmado',
                        productID: (_d = subscription.productID) !== null && _d !== void 0 ? _d : 'Pagamento não confirmado',
                        productName: (_e = subscription.productName) !== null && _e !== void 0 ? _e : 'Pagamento não confirmado',
                        valuePaid: (_f = subscription.valuePaid) !== null && _f !== void 0 ? _f : 0
                    });
                });
                const createdStudent = yield prisma_1.prisma.students.create({
                    data: {
                        name: studentData.name,
                        email: studentData.email,
                        gender: (_c = studentData.gender) !== null && _c !== void 0 ? _c : 'Não informado',
                        birth: studentData.birth,
                        phoneNumber: studentData.phoneNumber,
                        isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                        state: studentData.state,
                        city: studentData.city,
                        street: studentData.street,
                        homeNumber: studentData.homeNumber,
                        complement: (_d = studentData.complement) !== null && _d !== void 0 ? _d : 'Não informado',
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
                        stripeCustomerID: stripeCustomerCreatedID,
                        purcharsedSubscriptions: studentSchoolClasses
                    }
                });
                const { statusCode, isValid, errorMessage } = stripeResponse;
                return {
                    isValid,
                    successMessage: 'Estudante criado no banco de dados',
                    errorMessage,
                    students: createdStudent,
                    statusCode
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_e = error.statusCode) !== null && _e !== void 0 ? _e : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                return { isValid: false, errorMessage: String(error), statusCode: 403 };
            }
        });
    }
    updateStudent(studentData, studentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield prisma_1.prisma.students.findUnique({
                    where: {
                        id: studentID
                    }
                });
                if (!student) {
                    return {
                        isValid: false,
                        errorMessage: 'Estudante não encontrado.',
                        statusCode: 404
                    };
                }
                const updatedStudent = yield prisma_1.prisma.students.update({
                    where: {
                        id: studentID
                    },
                    data: Object.assign({}, studentData)
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    students: updatedStudent
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
    cancelSubscription(studentID, stripeSubscriptionID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield prisma_1.prisma.students.findFirst({
                    where: {
                        id: studentID
                    }
                });
                if (!student) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Estudante não encontrado."
                    };
                }
                const subscription = yield server_1.stripe.subscriptions.retrieve(stripeSubscriptionID);
                if (!subscription) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Inscrição não encontrada no stripe."
                    };
                }
                yield server_1.stripe.subscriptions.cancel(subscription.id);
                yield prisma_1.prisma.students.update({
                    where: {
                        id: studentID
                    }, data: {
                        purcharsedSubscriptions: {
                            updateMany: {
                                where: {
                                    stripeSubscriptionID: subscription.id
                                },
                                data: {
                                    paymentStatus: "canceled"
                                }
                            }
                        }
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    successMessage: 'Inscrição cancelada com sucesso.'
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                return { isValid: false, errorMessage: String(error), statusCode: 403 };
            }
        });
    }
    refundStudent(studentID, chargeID) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Este comentário explica o que a função faz.
            // Esta função reembolsa uma cobrança.
            try {
                const student = yield prisma_1.prisma.students.findFirst({
                    where: { id: studentID }
                });
                if (!student) {
                    return {
                        statusCode: 403,
                        isValid: false,
                        errorMessage: 'Inscrição não encontrada',
                    };
                }
                // Cria um reembolso para a cobrança no Stripe.
                const refund = yield server_1.stripe.refunds.create({
                    charge: chargeID,
                });
                const charge = yield server_1.stripe.charges.retrieve(chargeID);
                const { invoice, amount } = charge;
                if (!invoice || typeof (invoice) != 'string') {
                    return {
                        statusCode: 403,
                        isValid: false,
                        errorMessage: 'Cobrança não encontrada.',
                    };
                }
                const studentInvoice = yield server_1.stripe.invoices.retrieve(invoice);
                const invoiceProductID = (_a = studentInvoice.lines.data[0].price) === null || _a === void 0 ? void 0 : _a.product;
                if (!invoiceProductID || typeof (invoiceProductID) !== 'string') {
                    return {
                        statusCode: 403,
                        isValid: false,
                        errorMessage: 'Inscrição não encontrada pelo sistema',
                    };
                }
                const refundedStudent = yield prisma_1.prisma.students.update({
                    where: { id: studentID },
                    data: {
                        purcharsedSubscriptions: {
                            updateMany: {
                                where: {
                                    productID: invoiceProductID
                                },
                                data: {
                                    paymentStatus: "refunded",
                                    valuePaid: {
                                        decrement: amount
                                    }
                                }
                            }
                        }
                    }
                });
                // Retorna uma resposta de sucesso com o reembolso.
                return {
                    isValid: true,
                    successMessage: 'Reembolso realizado com sucesso!',
                    students: refundedStudent,
                    statusCode: 202
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_b = error.statusCode) !== null && _b !== void 0 ? _b : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                    const mongoDBError = error.message.slice(error.message.search('Argument'));
                    // Retorna uma resposta de erro com o erro do MongoDB.
                    return {
                        isValid: false,
                        errorMessage: mongoDBError,
                        statusCode: 403,
                    };
                }
                // Trata os erros gerais.
                return {
                    statusCode: 402,
                    isValid: false,
                    errorMessage: String(error),
                };
            }
        });
    }
    listChargesStudent(studentID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Este comentário explica o que a função faz.
            // Esta função lista as cobranças de uma doação.
            try {
                // Busca a doação no banco de dados.
                const student = yield prisma_1.prisma.students.findFirst({
                    where: { id: studentID },
                });
                // Verifica se a doação existe.
                if (!student) {
                    // Retorna uma resposta de erro se a doação não existir.
                    return {
                        isValid: false,
                        errorMessage: 'Estudante não encontrado.',
                        statusCode: 403,
                    };
                }
                // Obtém o ID do cliente do Stripe da doação.
                const stripeCustomerID = student.stripeCustomerID;
                // Busca as cobranças do cliente do Stripe no Stripe.
                const charges = yield server_1.stripe.charges.search({
                    query: `customer:"${stripeCustomerID}"`,
                });
                // Retorna uma resposta de sucesso com as cobranças.
                return {
                    isValid: true,
                    successMessage: `As cobranças do ${student.name} foram listadas com sucesso!`,
                    charges,
                    statusCode: 202,
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                    const mongoDBError = error.message.slice(error.message.search('Argument'));
                    // Retorna uma resposta de erro com o erro do MongoDB.
                    return {
                        isValid: false,
                        errorMessage: mongoDBError,
                        statusCode: 403,
                    };
                }
                // Trata os erros gerais.
                return {
                    statusCode: 402,
                    isValid: false,
                    errorMessage: String(error),
                };
            }
        });
    }
    syncStudents() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const students = yield prisma_1.prisma.students.findMany();
                students.forEach((student) => __awaiter(this, void 0, void 0, function* () {
                    const { purcharsedSubscriptions } = student;
                    if (!purcharsedSubscriptions) {
                        return student;
                    }
                    purcharsedSubscriptions.forEach((subscription) => __awaiter(this, void 0, void 0, function* () {
                        var _b;
                        const { stripeSubscriptionID } = subscription;
                        const stripeSubscription = yield server_1.stripe.subscriptions.retrieve(stripeSubscriptionID);
                        const { unit_amount } = stripeSubscription.items.data[0].price;
                        yield prisma_1.prisma.students.update({
                            where: { id: student.id },
                            data: {
                                purcharsedSubscriptions: {
                                    updateMany: {
                                        where: {
                                            stripeSubscriptionID: subscription.stripeSubscriptionID
                                        }, data: {
                                            paymentStatus: (_b = stripeSubscription.status) !== null && _b !== void 0 ? _b : 'Not found',
                                            valuePaid: unit_amount !== null && unit_amount !== void 0 ? unit_amount : 0
                                        }
                                    }
                                }
                            }
                        });
                    }));
                }));
                return {
                    statusCode: 200,
                    isValid: true,
                    successMessage: "Inscrições sincronizadas com sucesso."
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                    const mongoDBError = error.message.slice(error.message.search('Argument'));
                    // Retorna uma resposta de erro com o erro do MongoDB.
                    return {
                        isValid: false,
                        errorMessage: mongoDBError,
                        statusCode: 403,
                    };
                }
                // Trata os erros gerais.
                return {
                    statusCode: 402,
                    isValid: false,
                    errorMessage: String(error),
                };
            }
        });
    }
}
exports.StudentsRepository = StudentsRepository;
