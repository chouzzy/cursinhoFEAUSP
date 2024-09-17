import { Request, Response } from "express"
import { Donations } from "../../entities/Donations"
import { DonationsRepository } from "../../repositories/implementations/DonationsRepository"
import { PixDonationUseCase } from "./PixDonationUseCase"
import crypto from "crypto-js";
import EfiPay from 'sdk-node-apis-efi';
import fs from 'fs'
import path from 'path'
import https from 'https'
import axios from "axios";


interface CreateDonationProps {
    name: Donations["name"]
    email: Donations["email"]
    phoneNumber: Donations["phoneNumber"]
    isPhoneWhatsapp: Donations["isPhoneWhatsapp"]
    gender?: Donations["gender"]
    birth: Donations["birth"]
    state: Donations["state"]
    city: Donations["city"]
    street: Donations["street"]
    homeNumber: Donations["homeNumber"]
    complement?: Donations["complement"]
    district: Donations["district"]
    zipCode: Donations["zipCode"]
    cpf: Donations["cpf"]
    rg: Donations["rg"]
    cnpj: Donations["cnpj"]
    ufrg: Donations["ufrg"]
    valuePaid: Donations["valuePaid"]
    token: string
    paymentMethodID: string
    productSelectedID: string
    cycles: number
}


class PixDonationController {

    async handle(req: Request, res: Response): Promise<Response> {


        try {
            // const cert = fs.readFileSync(
            //     path.resolve(__dirname, `./${process.env.EFI_CERT}`)
            // )

            // const agent = new https.Agent({
            //     pfx: cert,
            //     passphrase: '',
            // })

            // const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')

            // const config = {
            //     method: 'post',
            //     url: `${process.env.EFI_ENDPOINT}/oauth/token`, // Use uma variável de ambiente para a URL base
            //     headers: {
            //         Authorization: `Basic ${credentials}`, // Substitua 'credentials' pelas suas credenciais
            //         'Content-Type': 'application/json'
            //     },
            //     httpsAgent: agent, // Opcional: para configurações de proxy ou outros agentes HTTP
            //     data: {
            //         grant_type: 'client_credentials'
            //     }
            // };

            // await axios(config)
            //     .then(response => {
            //         // Lógica para lidar com a resposta bem-sucedida
            //         console.log(response.data);
            //         return res.status(202).json({ response: response.data })
            //     })
            //     .catch(error => {
            //         // Lógica para lidar com erros
            //         console.error(error);
            //         return res.status(400).json({ response: "resposta" })
            //     });

            // // return res.status(202).json({ response: "resposta" })
            return res.status(202).json('Pix Donation Controller acionado')

        } catch (error) {
            return res.status(403).send({ message: String(error) })
        }




    }
}

export { PixDonationController, CreateDonationProps }