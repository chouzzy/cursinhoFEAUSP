import axios from 'axios';
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

// REMOVIDO: const authString = Buffer.from(`${SANTANDER_CLIENT_ID}:${SANTANDER_CLIENT_SECRET}`).toString('base64');

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br',
  httpsAgent,
});

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('SANTANDER_CLIENT_ID:', SANTANDER_CLIENT_ID);
  console.log('SANTANDER_CLIENT_SECRET:', SANTANDER_CLIENT_SECRET);

  console.log('Gerando novo access_token para o Santander...');

  // **CORREÇÃO CONFORME SOLICITADO:**
  // 1. `grant_type` vai na URL como query parameter.
  const urlWithGrantType = `/oauth/token?grant_type=client_credentials`;

  // 2. `client_id` e `client_secret` vão no corpo da requisição, formatados como x-www-form-urlencoded.
  const requestBody = new URLSearchParams();
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');
  // Não adicionamos 'scope' aqui, pois não foi mencionado e pode ser opcional ou padrão.
  console.log('Request Body for Token:', requestBody.toString());
  try {
    const response = await axios.post(
      urlWithGrantType,
      requestBody, // Corpo da requisição com client_id e client_secret
      {
        baseURL: 'https://trust-pix.santander.com.br', // Assegurando a URL base correta
        headers: {
          // 3. Removemos o 'Authorization: Basic' e definimos o Content-Type correto.
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent,
      }
    );

    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');

    if (!accessToken) {
      throw new Error('Access token não recebido do Santander.');
    }
    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter access_token do Santander:', error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken();

  const response = await apiClient.put(`/cob/${txid}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`, // As outras chamadas usam Bearer token
    },
  });
  return response.data;
}

export const santanderApiClient = {
  createCob,
};

