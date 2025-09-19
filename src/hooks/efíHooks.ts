import axios from "axios";
import { getEfiCredentials } from "../utils/studentHelpers";
import { agent } from "../server";
import { CreatePixStudentRequestProps } from "../modules/registrations/useCases/Students/createPixStudents/CreatePixStudentsController";
import { createPixProps, pixCobDataProps } from "../types";



async function getEfíAccessToken(agent: any, credentials: any) {

    try {
        const response = await axios({
            method: 'POST',
            url: `${process.env.EFI_ENDPOINT}/oauth/token`,
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            data: {
                grant_type:
                    'client_credentials'
            }
        });

        console.log('response.data.access_token')
        console.log(response.data.access_token)

        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining Efí access token:', error);
        throw error; // Re-throw the error for further handling
    }
}


async function criarCobrancaPix({ cpf, name, valuePaid }: createPixProps) {
    try {

        const dadosCobranca = {
            calendario: {
                expiracao: 180
            },
            devedor: {
                cpf: `${cpf}`,
                nome: `${name}`
            },
            valor: {
                original: valuePaid.toFixed(2)
            },
            chave: `${process.env.EFI_CHAVE_PIX}`,
            solicitacaoPagador: `Muito obrigado pela sua contribuição, ${name}! :)`
        }


        const credentials = await getEfiCredentials()

        const token = await getEfíAccessToken(agent, credentials)

        const response = await axios({
            method: 'POST',
            url: `${process.env.EFI_ENDPOINT}/v2/cob`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            data: JSON.stringify(dadosCobranca)

        });

        console.log('Cobrança criada com sucesso:', response.data);
        return response.data; // Retorna os dados da cobrança criada

    } catch (error) {
        throw error; // Lança o erro para ser tratado em outro ponto da aplicação
    }
}

export { criarCobrancaPix, getEfíAccessToken }