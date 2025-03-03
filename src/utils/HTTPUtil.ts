import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { logger } from './logger.js';

export class HTTPUtil {
    private static readonly BASE_URL = 'https://backend.antiskid.club';
    private static readonly LUMOS_KEY = 'Solara-FUCKTOPU40M64X266190JOK77Q7N1633S7';

    static async getResponse(url: string): Promise<string | null>;
    static async getResponse(url: string, headers: Record<string, string>): Promise<string | null>;
    static async getResponse(url: string, headers?: Record<string, string>): Promise<string | null> {
        try {
            logger.debug(`Making HTTP request to: ${url}`);
            logger.debug(`Headers: ${JSON.stringify(headers, null, 2)}`);

            const response: AxiosResponse = await axios.get(url, {
                headers: headers,
                timeout: 20000,
                validateStatus: null
            });

            logger.debug(`Response status: ${response.status}`);
            logger.debug(`Response data: ${JSON.stringify(response.data, null, 2)}`);

            return response.data;
        } catch (error) {
            logger.error('HTTP Request failed:', error);
            return null;
        }
    }

    static async fetchLumosLogs(playerName: string, executorId: string): Promise<any | null> {
        try {
            const headers = {
                'player': playerName,
                'LumosKey': this.LUMOS_KEY,
                'mode': 'VIEW_LOGS',
                'executor': executorId
            };

            logger.debug(`Fetching Lumos logs for player: ${playerName}`);
            logger.debug(`Request headers: ${JSON.stringify(headers, null, 2)}`);

            const response = await axios.get(this.BASE_URL, {
                headers: headers,
                timeout: 20000,
                validateStatus: null
            });

            logger.debug(`Response status: ${response.status}`);
            logger.debug(`Response headers: ${JSON.stringify(response.headers, null, 2)}`);
            logger.debug(`Raw response data: ${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`);

            if (typeof response.data === 'object') {
                return response.data;
            }

            if (typeof response.data === 'string') {
                try {
                    return JSON.parse(response.data);
                } catch (parseError) {
                    logger.error(`JSON Parse Error: ${parseError.message}`);
                    logger.error(`Raw data that failed to parse: ${response.data}`);
                    return null;
                }
            }

            logger.error(`Unexpected response type: ${typeof response.data}`);
            return null;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('Axios error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    headers: error.response?.headers
                });
            } else {
                logger.error('Failed to fetch Lumos logs:', error);
            }
            return null;
        }
    }

    static async addTrustedUser(username: string): Promise<void> {
        try {
            await axios.post(`${this.BASE_URL}/service/known`, username, {
                headers: {
                    'User-Agent': 'Lumos Client/1.0',
                    'lumoskey': this.LUMOS_KEY
                },
                timeout: 20000
            });
        } catch (error) {
            logger.error('Failed to add trusted user:', error);
        }
    }
} 