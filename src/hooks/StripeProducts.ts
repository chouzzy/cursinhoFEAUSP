import { ChargeRefundedProps, CustomerSubscriptionCreated, StripeCreateProductProps, StripeDeactivatedProduct, validationResponse } from "../types"
import { stripe } from "../server";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { CreateDonationProps } from "../modules/donations/useCases/createDonation/CreateDonationController";


class StripeProducts {

    async createProduct(
        product: StripeCreateProductProps
    ): Promise<validationResponse> {

        try {

            const schoolClassFound = await prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { title: product.name },
                    ]
                }

            })

            if (!schoolClassFound) {
                return {
                    isValid: false,
                    errorMessage: " Erro de Hook: Os dados do produto não correspondem a nenhum produto ",
                    statusCode: 403
                }
            }

            const stripeCreatedProduct = await stripe.products.create({
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
            })

            return {
                isValid: true,
                statusCode: 202,
                stripeCreatedProductID: stripeCreatedProduct.id,
                successMessage: "Cliente criado no servidor Stripe"
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientValidationError) {
                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }
            }

            else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }



    }

    async deleteProduct(
        productID: string
    ): Promise<Boolean> {

        const productDeactivated: StripeDeactivatedProduct = await stripe.products.update(
            productID,
            { active: false }
        );

        return productDeactivated.active
    }
}

export { StripeProducts }