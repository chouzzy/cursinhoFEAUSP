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
exports.UpdateSchoolClassUseCase = void 0;
const UpdateSchoolClassCheck_1 = require("./UpdateSchoolClassCheck");
class UpdateSchoolClassUseCase {
    constructor(schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }
    execute(schoolClassData, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate the body sent from the frontend service
            console.log('schoolClassData');
            console.log(schoolClassData);
            const bodyValidation = yield (0, UpdateSchoolClassCheck_1.checkBody)(schoolClassData);
            console.log('after checkbody');
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            if (schoolClassData.selectiveStages) {
                schoolClassData.selectiveStages.map(stage => {
                    if (!stage.resultsDate) {
                        stage.resultsDate = null;
                    }
                });
            }
            console.log('passamos o selective stages');
            // schoolClassData = {
            //     informations: {
            //         description: "Descrição 2311 teste 1516 o teste funciona vindo do front agora",
            //         observations:'teste',
            //             whoCanParticipate: "anyone",
            //                 classContent: "class",
            //                     dateSchedule: "20/12/2311",
            //                         hourSchedule: "13h50",
            //                             color: "#800080"
            //     },
            //     selectiveStages: [
            //         {
            //             stagesID: "7adbeed2-1955-4158-84ea-c940eedf27d5",
            //             when: "stage.when teste 2311",
            //             description: "stage.description",
            //             resultsDate: new Date()
            //         }
            //     ],
            //     status: "active",
            //     stripeProductID: "prod_P3jZV9lyolbJQn",
            //     title: "Período diurno teste 2311.0933",
            //     registrations: {
            //         description: "Descrição da matricula 2311.0933",
            //         value: 500
            //     },
            //     subscriptions: {
            //         status: "active",
            //         price: 3500,
            //         subscriptionSchedule: "subscriptionSchedule test"
            //     }
            // }
            const upatedSchoolClassResponse = yield this.schoolClassRepository.updateSchoolClass(schoolClassData, schoolClassID);
            return upatedSchoolClassResponse;
        });
    }
}
exports.UpdateSchoolClassUseCase = UpdateSchoolClassUseCase;
