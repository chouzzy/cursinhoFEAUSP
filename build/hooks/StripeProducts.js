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
class StripeProducts {
    getProduct(productID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stripeProduct = yield server_1.stripe.products.retrieve(productID);
                if (!stripeProduct) {
                    throw Error('Produto não encontrado no stripe');
                }
                return stripeProduct;
            }
            catch (error) {
                throw error;
            }
        });
    }
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
                    throw Error("Turma não encontrada pelo título.");
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
                if (!stripeCreatedProduct) {
                    throw Error("Ocorreu um erro ao criar o produto no stripe");
                }
                return stripeCreatedProduct;
            }
            catch (error) {
                throw error;
            }
        });
    }
    deleteProduct(productID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const productDeactivated = yield server_1.stripe.products.update(productID, { active: false });
                return productDeactivated.active;
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateProduct(productID, name, active, description, product) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!name) {
                    name = product.name;
                }
                if (!active) {
                    active = product.active;
                }
                console.log('description');
                console.log(description);
                if (!description || description == null) {
                    console.log('description 2');
                    console.log(description);
                    description = product.description;
                }
                const productDeactivated = yield server_1.stripe.products.update(productID, {
                    name,
                    active,
                    description,
                });
                return productDeactivated.active;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.StripeProducts = StripeProducts;
