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
exports.CreateSchoolClassUseCase = void 0;
const StripeProducts_1 = require("../../../../../hooks/StripeProducts");
const CreateSchoolClassCheck_1 = require("./CreateSchoolClassCheck");
class CreateSchoolClassUseCase {
    constructor(schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }
    execute(schoolClassData) {
        return __awaiter(this, void 0, void 0, function* () {
            schoolClassData.stripeProductID = 'no stripe product id registered';
            // Validate the body sent from the frontend service
            const bodyValidation = yield (0, CreateSchoolClassCheck_1.checkBody)(schoolClassData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const createSchoolClassResponse = yield this.schoolClassRepository.createSchoolClass(schoolClassData);
            if (!createSchoolClassResponse.schoolClass) {
                return createSchoolClassResponse;
            }
            const stripeProducts = new StripeProducts_1.StripeProducts();
            const { schoolClass } = createSchoolClassResponse;
            const product = {
                name: schoolClass.title,
                default_price_data: schoolClass.subscriptions.price,
                description: schoolClass.informations.description,
                metadata: {
                    schoolClassID: schoolClass.id,
                    productType: 'studentSubscription',
                    title: schoolClass.title,
                    semester: schoolClass.informations.dateSchedule,
                    year: schoolClass.informations.dateSchedule,
                }
            };
            const stripeProductCreated = yield stripeProducts.createProduct(product);
            if (!stripeProductCreated.stripeCreatedProductID) {
                return stripeProductCreated;
            }
            const { stripeCreatedProductID } = stripeProductCreated;
            const updatedSchoolClassResponse = yield this.schoolClassRepository.updateSchoolClass(schoolClass, schoolClass.id, stripeCreatedProductID);
            return updatedSchoolClassResponse;
        });
    }
}
exports.CreateSchoolClassUseCase = CreateSchoolClassUseCase;
