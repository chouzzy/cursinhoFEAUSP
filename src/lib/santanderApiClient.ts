import axios, { AxiosRequestConfig } from 'axios'; // Importa AxiosRequestConfig
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
const CERT_PATH = process.env.SANTANDER_CERT_PATH;
const KEY_PATH = process.env.SANTANDER_KEY_PATH;

if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
  throw new Error("As variáveis de ambiente do Santander não foram configuradas corretamente.");
}

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

// A baseURL está correta para as chamadas da API PIX (ex: /cob)
const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br',
  httpsAgent,
});

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  // accessToken = null; // Descomente para forçar a renovação

  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('SANTANDER_CLIENT_ID:', SANTANDER_CLIENT_ID);
  console.log('SANTANDER_CLIENT_SECRET:', SANTANDER_CLIENT_SECRET);
  console.log('Gerando novo access_token para o Santander...');

  // **ALTERAÇÃO:** Voltamos a usar a URL simples, apenas com grant_type
  const urlWithParams = `/api/v1/oauth/token?grant_type=client_credentials`;

  const requestBody = new URLSearchParams();
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');
  console.log('Request Body for Token:', requestBody.toString());
  console.log('Request URL for Token:', `https://trust-pix.santander.com.br${urlWithParams}`);


  try {
    const response = await apiClient.post(
      urlWithParams, // URL apenas com grant_type
      requestBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    console.log('Access Token Response:', response.data);
    // Verificamos os scopes que o Santander retornou por padrão
    console.log(`Scopes concedidos por padrão: ${response.data.scopes || 'Nenhum'}`);


    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');

    if (!accessToken) {
      throw new Error('Access token não recebido do Santander.');
    }
    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter access_token do Santander:', error.response?.status, error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken();
  const url = `https://trust-pix.santander.com.br/cob/${txid}`;

  console.log(`Tentando fazer PUT para: ${url}`);
  console.log(`Usando token com scopes: ${accessToken ? JSON.stringify(accessToken.split('.').map(part => Buffer.from(part, 'base64').toString())) : 'N/A'}`); // Loga scopes decodificados

  const options: AxiosRequestConfig = {
    method: 'PUT',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: data,
    httpsAgent: httpsAgent
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao fazer PUT para ${url}:`, error.response?.status, error.response?.data || error.message);
    console.error('Opções da requisição (sem dados):', { method: options.method, url: options.url, headers: options.headers });
    throw error;
  }
}

export const santanderApiClient = {
  createCob,
};

