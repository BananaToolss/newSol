import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * 定义 JsonRpcRequest 类型
 */
interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any[];
}

/**
 * 定义 JsonRpcResponse 类型
 */
interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

/**
 * JitoJsonRpcClient 类
 */
class JitoJsonRpcClient {
  private baseUrl: string;
  private uuid?: string;
  private client: AxiosInstance;

  constructor(baseUrl: string, uuid?: string) {
    this.baseUrl = baseUrl;
    this.uuid = uuid;
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async sendRequest(endpoint: string, method: string, params: any[] = []): Promise<JsonRpcResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const data: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    };

    console.log(`Sending request to: ${url}`);
    console.log(`Request body: ${JSON.stringify(data, null, 2)}`);

    try {
      const response = await this.client.post<JsonRpcResponse>(url, data);
      console.log(`Response status: ${response.status}`);
      console.log(`Response body: ${JSON.stringify(response.data, null, 2)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`HTTP error: ${error.message}`);
        throw error;
      } else {
        console.error(`Unexpected error: ${error}`);
        throw new Error('An unexpected error occurred');
      }
    }
  }

  public async getTipAccounts(): Promise<JsonRpcResponse> {
    const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
    return this.sendRequest(endpoint, 'getTipAccounts');
  }

  public async getRandomTipAccount(): Promise<any> {
    const tipAccountsResponse = await this.getTipAccounts();
    if (tipAccountsResponse.result && Array.isArray(tipAccountsResponse.result) && tipAccountsResponse.result.length > 0) {
      const randomIndex = Math.floor(Math.random() * tipAccountsResponse.result.length);
      return tipAccountsResponse.result[randomIndex];
    } else {
      throw new Error('No tip accounts available');
    }
  }

  public async sendBundle(params: any[]): Promise<JsonRpcResponse> {

    console.log(params, "我的参数-------------------------------");
    const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
    return this.sendRequest(endpoint, 'sendBundle', params);
  }

  public async sendTxn(params: any[], bundleOnly: boolean = false): Promise<JsonRpcResponse> {
    let endpoint = '/transactions';
    const queryParams: string[] = [];

    if (bundleOnly) {
      queryParams.push('bundleOnly=true');
    }

    if (this.uuid) {
      queryParams.push(`uuid=${this.uuid}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join('&')}`;
    }

    return this.sendRequest(endpoint, 'sendTransaction', params);
  }

  public async getInFlightBundleStatuses(params: any[]): Promise<JsonRpcResponse> {
    const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
    return this.sendRequest(endpoint, 'getInflightBundleStatuses', params);
  }

  public async getBundleStatuses(params: any[]): Promise<JsonRpcResponse> {
    const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
    return this.sendRequest(endpoint, 'getBundleStatuses', params);
  }

  public async confirmInflightBundle(bundleId: string, timeoutMs: number = 60000): Promise<any> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const response = await this.getInFlightBundleStatuses([[bundleId]]);

        if (response.result && Array.isArray(response.result.value) && response.result.value.length > 0) {
          const bundleStatus = response.result.value[0];

          console.log(`Bundle status: ${bundleStatus.status}, Landed slot: ${bundleStatus.landed_slot}`);

          if (bundleStatus.status === "Failed") {
            return bundleStatus;
          } else if (bundleStatus.status === "Landed") {
            const detailedStatus = await this.getBundleStatuses([[bundleId]]);
            if (detailedStatus.result && Array.isArray(detailedStatus.result.value) && detailedStatus.result.value.length > 0) {
              return detailedStatus.result.value[0];
            } else {
              console.log('No detailed status returned for landed bundle.');
              return bundleStatus;
            }
          }
        } else {
          console.log('No status returned for the bundle. It may be invalid or very old.');
        }
      } catch (error) {
        console.error('Error checking bundle status:', error);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Bundle ${bundleId} has not reached a final state within ${timeoutMs}ms`);
    return { status: 'Timeout' };
  }
}

export default JitoJsonRpcClient;
