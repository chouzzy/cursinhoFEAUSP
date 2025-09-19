import { StripeCreateProductProps, validationResponse } from "../types"
import { stripe } from "../server";
import { prisma } from "../prisma";
import Stripe from "stripe";


class StripeProducts {

    async getProduct(productID: string) {
        try {
            const stripeProduct = await stripe.products.retrieve(productID)

            if (!stripeProduct) {
                throw Error('Produto não encontrado no stripe')
            }

            return stripeProduct
        } catch (error) {
            throw error
        }
    }

    async createProduct(
        product: StripeCreateProductProps
    ) {

        try {

            const schoolClassFound = await prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { title: product.name },
                    ]
                }

            })

            if (!schoolClassFound) {
                throw Error("Turma não encontrada pelo título.")
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

            if (!stripeCreatedProduct) {
                throw Error("Ocorreu um erro ao criar o produto no stripe")
            }


            return stripeCreatedProduct

        } catch (error: unknown) {
            throw error
        }

    }

    async deleteProduct(
        productID: string
    ): Promise<Boolean> {
        try {

            const productDeactivated = await stripe.products.update(
                productID,
                { active: false }
            );

            return productDeactivated.active
        } catch (error) {
            throw error
        }
    }

    async updateProduct(
        productID: string,
        name: string,
        active: boolean,
        description: string | null,
        product: Stripe.Response<Stripe.Product>
    ): Promise<Boolean> {
        try {

            if (!name) {
                name = product.name
            }
            if (!active) {
                active = product.active
            }
            console.log('description')
            console.log(description)
            if (!description || description == null) {
                console.log('description 2')
                console.log(description)
                description = product.description
            }

            const productDeactivated = await stripe.products.update(
                productID,
                {
                    name,
                    active,
                    description,

                }
            );

            return productDeactivated.active
        } catch (error) {
            throw error
        }
    }

}

export { StripeProducts }