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

// Mantemos apiClient para futuras chamadas GET ou PATCH, se necessário,
// mas a createCob usará axios.request diretamente.
const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br',
  httpsAgent,
});

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  // Limpamos o token antigo se a última tentativa falhou (para forçar a busca de um novo com os scopes corretos)
  // Isso pode ser útil durante o desenvolvimento se os scopes mudarem.
  // Em produção estável, a checagem de expiração abaixo é suficiente.
  // accessToken = null; // Descomente se precisar forçar a renovação a cada chamada durante testes.

  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('SANTANDER_CLIENT_ID:', SANTANDER_CLIENT_ID);
  console.log('SANTANDER_CLIENT_SECRET:', SANTANDER_CLIENT_SECRET);
  console.log('Gerando novo access_token para o Santander...');

  // **CORREÇÃO: Adicionando SCOPES na URL**
  // Definimos os escopos necessários para criar cobranças e gerenciar webhooks.
  const requiredScopes = 'cob.write cob.read';
  const urlWithParams = `/oauth/token?grant_type=client_credentials&scope=${encodeURIComponent(requiredScopes)}`;

  const requestBody = new URLSearchParams();
  requestBody.append('client_id', SANTANDER_CLIENT_ID || '');
  requestBody.append('client_secret', SANTANDER_CLIENT_SECRET || '');
  console.log('Request Body for Token:', requestBody.toString());
  console.log('Request URL for Token:', `https://trust-pix.santander.com.br${urlWithParams}`);


  try {
    const response = await axios.post(
      urlWithParams, // URL agora contém grant_type E scope
      requestBody,
      {
        baseURL: 'https://trust-pix.santander.com.br',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent,
      }
    );

    console.log('Access Token Response:', response.data);
    // Verifica se os scopes retornados incluem os que pedimos
    if (!response.data.scopes || !requiredScopes.split(' ').every(scope => response.data.scopes.includes(scope))) {
         console.warn(`Nem todos os scopes solicitados foram concedidos pelo Santander. Recebido: ${response.data.scopes}`);
         // Poderíamos lançar um erro aqui se um scope essencial faltar, mas por enquanto só avisamos.
    }

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
  const token = await getAccessToken(); // Garante que temos um token com os scopes corretos
  const url = `https://trust-pix.santander.com.br/cob/${txid}`;

  console.log(`Tentando fazer PUT para: ${url}`);

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

