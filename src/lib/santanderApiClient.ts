import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
// **REVERTENDO PARA OS ARQUIVOS .PEM SEPARADOS**
const CERT_PATH = process.env.SANTANDER_CERT_PATH; // Caminho para o .pem da chave pública (cadeia completa)
const KEY_PATH = process.env.SANTANDER_KEY_PATH;   // Caminho para o .pem da chave privada

// Validamos as variáveis .PEM
if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
  throw new Error("As variáveis de ambiente do Santander (CERT_PATH e KEY_PATH) não foram configuradas corretamente.");
}

console.log('Criando httpsAgent com os arquivos PEM separados...');
let httpsAgent: https.Agent;
try {
  // **VOLTANDO A USAR cert e key SEPARADAMENTE**
  httpsAgent = new https.Agent({
    cert: fs.readFileSync(CERT_PATH), // Lê o .pem com a cadeia pública
    key: fs.readFileSync(KEY_PATH),   // Lê o .pem com a chave privada
    // passphrase: process.env.SANTANDER_KEY_PASSPHRASE // Descomente se sua chave PEM privada tiver senha
  });
  console.log('httpsS Agent criado com sucesso usando arquivos PEM separados.');
} catch (certError: any) {
  console.error("ERRO AO LER OS ARQUIVOS PEM:", certError.message);
  throw new Error("Falha ao carregar os certificados PEM do Santander. Verifique os caminhos no .env");
}


// A baseURL para operações como /cob precisa incluir /api/v1
const apiClient = axios.create({
    baseURL: 'https://trust-pix.santander.com.br/api/v1',
    httpsAgent, // O agent agora usa os PEMs separados
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
    // Usamos axios diretamente aqui, passando o httpsAgent configurado com PEM
    const response = await axios.post(
      urlForToken,
      requestBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent, // Passamos o agent com PEM separados
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
    // Usamos apiClient.put, que já tem o httpsAgent (com PEM separados) configurado
    const response = await apiClient.put(urlPath, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json, application/problem+json',
        },
        timeout: 15000
    });
    console.log('Chamada PUT para criar cobrança retornou.');

    console.log(`PUT para ${urlPath} bem-sucedido.`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.error(`Erro ao fazer PUT para ${fullUrl}: Timeout da requisição.`);
    } else {
        console.log(` Erro em JSON:`, JSON.stringify(error.response?.data || error.message));
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

