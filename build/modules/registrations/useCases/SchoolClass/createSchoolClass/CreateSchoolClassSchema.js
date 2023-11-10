"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchoolClassSchema = void 0;
const yup = __importStar(require("yup"));
const yup_password_1 = __importDefault(require("yup-password"));
(0, yup_password_1.default)(yup);
const createSchoolClassSchema = yup.object({
    title: yup.string().required("O título é obrigatório").min(3, "O título precisa ter no mínimo três caracteres"),
    status: yup.string().oneOf(['active', 'inactive'], "O status deve ser um dos seguintes valores: 'active' ou 'inactive' ").required("O status é obrigatório"),
    informations: yup.object({
        description: yup.string().required("Descrição obrigatória"),
        whoCanParticipate: yup.string().required("É obrigatório colocar quem pode participar"),
        observations: yup.string(),
        classContent: yup.string().required("Conteúdo da turma obrigatório"),
        dateSchedule: yup.string().required("Data obrigatória"),
        hourSchedule: yup.string().required("Horário obrigatório"),
        color: yup.string().required("Cor obrigatória"),
    }).required("As informações do curso são obrigatórias"),
    subscriptions: yup.object({
        status: yup.string().required("Status obrigatório"),
        price: yup.number().required("Preço obrigatório"),
        subscriptionSchedule: yup.string().required("Data de inscrição obrigatória"),
    }).required("Inscrição obrigatória"),
    selectiveStages: yup.array().of(yup.object().shape({
        when: yup.string().required("when required"),
        resultsDate: yup.date().nullable().typeError("resultsDate must be a valid date"),
        description: yup.string().required("description required"),
    })).required("selectiveStages required"),
    documents: yup.array().of(yup.object().shape({
        title: yup.string().min(3, 'O título deve conter ao menos 3 caracteres'),
        downloadLink: yup.string().min(3, 'O título deve conter ao menos 3 caracteres')
    })),
    registrations: yup.object({
        description: yup.string().required("A descrição é obrigatória."),
        value: yup.number().required("Valor obrigatório"),
    }).required("Dados da matrícula obrigatórios"),
});
exports.createSchoolClassSchema = createSchoolClassSchema;
