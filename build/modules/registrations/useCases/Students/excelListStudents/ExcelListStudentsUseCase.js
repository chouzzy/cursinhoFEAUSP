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
exports.ExcelListStudentsUseCase = void 0;
const ExcelListStudentsCheck_1 = require("./ExcelListStudentsCheck");
const exceljs_1 = require("exceljs");
//////
class ExcelListStudentsUseCase {
    constructor(studentsRepository) {
        this.studentsRepository = studentsRepository;
    }
    execute(studentsRequest) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const bodyValidation = yield (0, ExcelListStudentsCheck_1.checkQuery)(studentsRequest);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            let { page, pageRange, initDate, endDate } = studentsRequest;
            if (!initDate) {
                studentsRequest.initDate = '1979-01-01';
            }
            if (!endDate) {
                studentsRequest.endDate = '2999-01-01';
            }
            if (initDate == undefined) {
                studentsRequest.initDate = '1979-01-01';
            }
            if (endDate == undefined) {
                studentsRequest.endDate = '2999-01-01';
            }
            const pageAsNumber = parseInt((page === null || page === void 0 ? void 0 : page.toString()) || "0", 10);
            const pageRangeAsNumber = parseInt((pageRange === null || pageRange === void 0 ? void 0 : pageRange.toString()) || "10", 10);
            if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
                return {
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "page and pageRange must be numbers",
                };
            }
            const students = yield this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber);
            if (students.statusCode != 202) {
                return students;
            }
            // Create a new Excel workbook
            const workbook = new exceljs_1.Workbook();
            // Add a new worksheet to the workbook
            const worksheet = workbook.addWorksheet("Students");
            // Set the columns headers in the worksheet
            worksheet.addRow([
                "id",
                "name",
                "email",
                "gender",
                "birth",
                "phoneNumber",
                "isPhoneWhatsapp",
                "state",
                "city",
                "street",
                "homeNumber",
                "complement",
                "district",
                "zipCode",
                "cpf",
                "rg",
                "selfDeclaration",
                "oldSchool",
                "oldSchoolAdress",
                "highSchoolGraduationDate",
                "highSchoolPeriod",
                "metUsMethod",
                "exStudent",
                "stripeCustomerID",
                "purcharsedSubscriptions",
                "createdAt",
            ]);
            // Iterate through the students and add them to the worksheet
            (_a = students.studentsList) === null || _a === void 0 ? void 0 : _a.forEach(student => {
                worksheet.addRow([
                    student.id,
                    student.name,
                    student.email,
                    student.gender,
                    student.birth,
                    student.phoneNumber,
                    student.isPhoneWhatsapp,
                    student.state,
                    student.city,
                    student.street,
                    student.homeNumber,
                    student.complement,
                    student.district,
                    student.zipCode,
                    student.cpf,
                    student.rg,
                    student.selfDeclaration,
                    student.oldSchool,
                    student.oldSchoolAdress,
                    student.highSchoolGraduationDate,
                    student.highSchoolPeriod,
                    student.metUsMethod,
                    student.exStudent,
                    student.stripeCustomerID,
                    student.purcharsedSubscriptions,
                    student.createdAt,
                ]);
            });
            // Generate the Excel file
            const fileBuffer = yield workbook.xlsx.writeBuffer();
            // You can save the file to disk or send it as a response
            // For example, to save the file to disk:
            yield workbook.xlsx.writeFile("students1829.xlsx");
            return {
                isValid: true,
                statusCode: 202,
                fileBuffer: fileBuffer // Include the file buffer in the response
            };
        });
    }
}
exports.ExcelListStudentsUseCase = ExcelListStudentsUseCase;
