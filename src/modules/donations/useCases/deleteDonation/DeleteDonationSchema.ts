import { number, object, string } from "yup";

const donationSchema = object({
    paymentStatus: string().required("O paymentStatus é obrigatório").oneOf(['canceled'] as const)
    
})

export {donationSchema}