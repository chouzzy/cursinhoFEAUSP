import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
// **NOVA VARIÁVEL PARA O CERTIFICADO COMPLETO**
const FULL_CERT_PATH = process.env.SANTANDER_FULL_CERT_PATH; // Caminho para o .pem completo

// Removemos as variáveis PEM separadas
// const CERT_PATH = process.env.SANTANDER_CERT_PATH;
// const KEY_PATH = process.env.SANTANDER_KEY_PATH;

if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !FULL_CERT_PATH) {
  throw new Error("As variáveis de ambiente do Santander (Certificado Completo) não foram configuradas corretamente.");
}

console.log('Criando httpsAgent com o arquivo PEM completo...');
let httpsAgent: https.Agent;
try {
  // **TENTATIVA COM ARQUIVO ÚNICO**
  // Passamos o mesmo arquivo .pem para 'cert' (cadeia pública) e 'key' (chave privada)
  const fullCertContent = fs.readFileSync(FULL_CERT_PATH);
  httpsAgent = new https.Agent({
    cert: fullCertContent, // Espera-se que ele leia a cadeia pública daqui
    key: fullCertContent,   // Espera-se que ele leia a chave privada daqui
    // passphrase: process.env.SANTANDER_KEY_PASSPHRASE // Senha da chave privada, se o PEM estiver criptografado
  });
  console.log('httpsAgent criado com sucesso usando PEM completo.');
} catch (certError: any) {
  console.error("ERRO AO LER O ARQUIVO PEM COMPLETO:", certError.message);
  throw new Error("Falha ao carregar o certificado PEM completo do Santander. Verifique o caminho no .env");
}


// A baseURL para operações como /cob precisa incluir /api/v1
const apiClient = axios.create({
    baseURL: 'https://trust-pix.santander.com.br/api/v1',
    httpsAgent, // O agent agora usa o PEM completo
});


let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  console.log('Iniciando getAccessToken...');
  // accessToken = null; // Descomente para forçar a renovação

  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('SANTANDER_CLIENT_ID:', SANTANDER_CLIENT_ID);
  console.log('SANTANDER_CLIENT_SECRET:', SANTANDER_CLIENT_SECRET);
  console.log('Gerando novo access_token para o Santander...');

  const urlForToken = `https://trust-pix.santander.com.br/oauth/token?grant_type=client_credentials`;
  const requestBody = new URLSearchParams();
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');

  console.log('Request URL for Token:', urlForToken);
  console.log('Request Body for Token:', requestBody.toString());

  try {
    console.log('Tentando fazer POST para obter token...');
    // Usamos axios diretamente aqui, mas passamos o httpsAgent configurado com PEM completo
    const response = await axios.post(
      urlForToken,
      requestBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent, // Passamos o agent com PEM completo
        timeout: 15000
      }
    );
    console.log('Chamada POST para token retornou.');

    console.log('Access Token Response:', response.data);
    console.log(`Scopes concedidos pela configuração do portal: ${response.data.scopes || 'Nenhum'}`);

    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');

    if (!accessToken) {
      throw new Error('Access token não recebido do Santander.');
    }
    return accessToken;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.error('Erro ao obter access_token: Timeout da requisição.');
    } else {
        console.error('Erro ao obter access_token do Santander:', error.response?.status, error.response?.data || error.message);
    }
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  console.log('Iniciando createCob...');
  const token = await getAccessToken();
  console.log('Token obtido para createCob.');

  const urlPath = `/cob/${txid}`;
  const fullUrl = `${apiClient.defaults.baseURL}${urlPath}`;

  console.log(`Tentando fazer PUT para: ${fullUrl}`);

  try {
    console.log('Tentando fazer PUT para criar cobrança...');
    // Usamos apiClient.put, que já tem o httpsAgent (com PEM completo) configurado
    const response = await apiClient.put(urlPath, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json, application/problem+json',
        },
        // Não precisamos passar o agent de novo, já está na instância
        timeout: 15000
    });
    console.log('Chamada PUT para criar cobrança retornou.');

    console.log(`PUT para ${urlPath} bem-sucedido.`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.error(`Erro ao fazer PUT para ${fullUrl}: Timeout da requisição.`);
    } else {
        console.error(`Erro ao fazer PUT para ${fullUrl}:`, error.response?.status, error.response?.data || error.message);
    }
    console.error('Headers enviados na requisição PUT:', {
        'Authorization': `Bearer ${token ? token.substring(0, 10) + '...' : 'N/A'}`,
        'Accept': 'application/json, application/problem+json',
        'Content-Type': 'application/json'
    });
    throw error;
  }
}

export const santanderApiClient = {
  createCob,
};

