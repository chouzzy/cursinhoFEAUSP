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
exports.StripeProducts = void 0;
const server_1 = require("../server");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
class StripeProducts {
    createProduct(product) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const schoolClassFound = yield prisma_1.prisma.schoolClass.findFirst({
                    where: {
                        OR: [
                            { title: product.name },
                        ]
                    }
                });
                if (!schoolClassFound) {
                    return {
                        isValid: false,
                        errorMessage: " Erro de Hook: Os dados do produto não correspondem a nenhum produto ",
                        statusCode: 403
                    };
                }
                const stripeCreatedProduct = yield server_1.stripe.products.create({
                    name: product.name,
                    default_price_data: {
                        unit_amount: product.default_price_data,
                        currency: 'brl',
                        recurring: {
                            interval: 'month'
                        }
                    },
                    description: product.description,
                    metadata: {
                        schoolClassID: product.metadata.schoolClassID,
                        productType: product.metadata.productType,
                        title: product.metadata.title,
                        semester: product.metadata.semester,
                        year: product.metadata.year,
                    }
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    stripeCreatedProductID: stripeCreatedProduct.id,
                    successMessage: "Cliente criado no servidor Stripe"
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
    deleteProduct(productID) {
        return __awaiter(this, void 0, void 0, function* () {
            const productDeactivated = yield server_1.stripe.products.update(productID, { active: false });
            return productDeactivated.active;
        });
    }
}
exports.StripeProducts = StripeProducts;
