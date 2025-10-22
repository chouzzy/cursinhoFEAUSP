import axios, { AxiosRequestConfig } from 'axios';
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

// A baseURL para operações como /cob precisa incluir /api/v1
// A URL para /oauth/token é diferente e será chamada diretamente
const apiClient = axios.create({
    baseURL: 'https://trust-pix.santander.com.br/api/v1', // **CORREÇÃO APLICADA AQUI**
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

  // URL para obter o token (sem /api/v1)
  const urlForToken = `https://trust-pix.santander.com.br/oauth/token?grant_type=client_credentials`;

  const requestBody = new URLSearchParams();
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');

  console.log('Request URL for Token:', urlForToken);
  console.log('Request Body for Token:', requestBody.toString());

  try {
    // Usamos axios diretamente para ter controle total
    const response = await axios.post(
      urlForToken, // URL contém grant_type
      requestBody, // Corpo contém client_id, client_secret
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent, // Certificado necessário para a conexão
      }
    );

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
    console.error('Erro ao obter access_token do Santander:', error.response?.status, error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken();
  
  // Usamos apiClient que já tem a baseURL correta com /api/v1
  const urlPath = `/cob/${txid}`; // **CORREÇÃO: Usamos apenas o path relativo**

  console.log(`Tentando fazer PUT para: ${apiClient.defaults.baseURL}${urlPath}`);
  console.log(`Usando token com scopes decodificados: ${accessToken ? JSON.stringify(accessToken.split('.')[1] ? JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString()) : {}) : 'N/A'}`);

  // Usamos a instância apiClient agora, que já tem baseURL e httpsAgent
  try {
    const response = await apiClient.put(urlPath, data, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    console.log(`PUT para ${urlPath} bem-sucedido.`);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao fazer PUT para ${apiClient.defaults.baseURL}${urlPath}:`, error.response?.status, error.response?.data || error.message);
    console.error('Opções da requisição (sem dados):', { method: 'PUT', url: `${apiClient.defaults.baseURL}${urlPath}`, headers: { 'Authorization': `Bearer ${token}` } });
    throw error;
  }
}

export const santanderApiClient = {
  createCob,
};

