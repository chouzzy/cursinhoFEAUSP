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
const server_1 = require("../../../../server");
const stripe_1 = __importDefault(require("stripe"));
const ef_Hooks_1 = require("../../../../hooks/ef\u00EDHooks");
const studentHelpers_1 = require("../../../../utils/studentHelpers");
const StripeSubscriptionsManager_1 = require("../../../../hooks/StripeSubscriptionsManager");
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
    createPixStudent(studentData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // CHECA SE A TURMA EXISTE
                const studentDataSchoolClassID = studentData.purcharsedSubscriptions.schoolClassID;
                const schoolClassFound = yield (0, studentHelpers_1.getSchoolClassPrice)(studentDataSchoolClassID);
                if (!schoolClassFound || schoolClassFound === 'NOT FOUND') {
                    return {
                        isValid: false,
                        errorMessage: `Turma não encontrada`,
                        statusCode: 403
                    };
                }
                if (schoolClassFound === 'INACTIVE') {
                    return {
                        isValid: false,
                        errorMessage: `A turma se encontra inativa.`,
                        statusCode: 403
                    };
                }
                if (schoolClassFound === 'CLOSED') {
                    return {
                        isValid: false,
                        errorMessage: `A turma se encontra fechada.`,
                        statusCode: 403
                    };
                }
                // CHECA SE O ESTUDANTE EXISTE NO BANCO DE DADOS
                const { name, cpf, rg, purcharsedSubscriptions } = studentData;
                const { valuePaid } = purcharsedSubscriptions;
                const searchedStudent = yield (0, studentHelpers_1.getStudentByCPForRG)(cpf, rg);
                // CHECA SE JA EXISTE O ESTUDANTE NO BANCO - ATUALIZA
                if (searchedStudent) {
                    // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA E O PAGAMENTO CONCLUIDO
                    const studentAlreadySubscribed = yield (0, studentHelpers_1.checkIfPixAlreadyConcluded)(searchedStudent, studentData);
                    if (studentAlreadySubscribed) {
                        return {
                            isValid: false,
                            errorMessage: `A inscrição já foi comprada anteriormente e está ativa.`,
                            statusCode: 403
                        };
                    }
                    // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA E O PIX AINDA NÃO EXPIROU
                    const isPixExpired = yield (0, studentHelpers_1.checkIfPixIsExpired)(searchedStudent, studentData);
                    if (!isPixExpired) {
                        return {
                            isValid: false,
                            errorMessage: "O Pix gerado para essa inscrição ainda não expirou, e tem duração de 3 minutos.",
                            statusCode: 402
                        };
                    }
                    // AQUI OU O PIX EXPIROU OU NUNCA FOI COMPRADO!!!
                    // PIX COB
                    const pixData = yield (0, ef_Hooks_1.criarCobrancaPix)({ cpf, name, valuePaid });
                    const updatedStudent = yield (0, studentHelpers_1.updateStudentPix)(pixData, searchedStudent, studentData);
                    return {
                        isValid: true,
                        errorMessage: `Estudante atualizado com sucesso!`,
                        students: updatedStudent,
                        statusCode: 202
                    };
                }
                // PIX COB
                const pixData = yield (0, ef_Hooks_1.criarCobrancaPix)({ cpf, name, valuePaid });
                const createdStudent = yield (0, studentHelpers_1.createStudentPix)(studentData, pixData);
                return {
                    isValid: true,
                    successMessage: 'Estudante criado no banco de dados',
                    students: createdStudent,
                    statusCode: 202
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
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                return { isValid: false, errorMessage: String(error), statusCode: 403 };
            }
        });
    }
    createStudentPaymentIntent(studentData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { purcharsedSubscriptions, cpf, rg } = studentData;
                const { schoolClassID, paymentMethod, currency } = purcharsedSubscriptions;
                // CHECA SE A TURMA EXISTE
                const searchedSchoolClass = yield (0, studentHelpers_1.checkSchoolClassExists)(schoolClassID);
                if (!searchedSchoolClass) {
                    return {
                        isValid: false,
                        errorMessage: `Turma não encontrada.`,
                        statusCode: 403
                    };
                }
                // CHECA SE CLIENTE JÁ EXISTE NO STRIPE E CRIA
                const stripeCustomerID = yield (0, studentHelpers_1.getStripeStudentCustomerID)(studentData);
                // CHECA SE INSCRIÇÃO EXISTE NO BANCO DE DADOS
                const searchedStudent = yield (0, studentHelpers_1.getStudent)(cpf, rg);
                const stripeSubscriptions = new StripeSubscriptionsManager_1.StripeSubscriptionsManager();
                const stripeResponse = yield stripeSubscriptions.createStudentPaymentIntent({
                    stripeCustomerID,
                    cpf,
                    rg,
                    searchedSchoolClass,
                    paymentMethod,
                    currency
                });
                if (searchedStudent) {
                    // FILTRA POSSÍVEL INSCRIÇÃO JÁ PAGA
                    const studentAlreadyActive = yield (0, studentHelpers_1.getStudentAlreadyActive)(searchedStudent.id, schoolClassID);
                    if (studentAlreadyActive) {
                        return {
                            isValid: false,
                            errorMessage: `A inscrição já foi comprada e está ativa!.`,
                            students: studentAlreadyActive,
                            statusCode: 403
                        };
                    }
                    const updatedStudent = yield (0, studentHelpers_1.updateStudentPaymentInProgress)(searchedStudent, schoolClassID);
                    if (updatedStudent) {
                        return Object.assign(Object.assign({}, stripeResponse), { successMessage: 'Estudante atualizado e payment intent criado com sucesso!', students: updatedStudent });
                    }
                }
                const createdStudent = yield (0, studentHelpers_1.createStudent)(studentData, stripeCustomerID, schoolClassID);
                return Object.assign(Object.assign({}, stripeResponse), { successMessage: 'Estudante e payment intents criados com sucesso!', students: createdStudent });
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
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
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
                if (!stripeSubscriptionID) {
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
                        if (stripeSubscriptionID) {
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
                        }
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
