import axios from "axios";

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

        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining Efí access token:', error);
        throw error; // Re-throw the error for further handling
    }
}


async function criarCobrancaPix(agent:any, token: string, dadosCobranca: any) {
    try {
        const response = await axios({
            method: 'POST',
            url: `${process.env.EFI_ENDPOINT}/v2/cob`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent,
            data: dadosCobranca

        });

        console.log('Cobrança criada com sucesso:', response.data);
        return response.data; // Retorna os dados da cobrança criada
    } catch (error) {
        console.error('Erro ao criar cobrança:', error);
        throw error; // Lança o erro para ser tratado em outro ponto da aplicação
    }
}

export {criarCobrancaPix, getEfíAccessToken}