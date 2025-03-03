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
            const response: AxiosResponse = await axios.get(url, {
                headers: headers,
                timeout: 20000,
                validateStatus: null
            });

            return response.data;
        } catch (error) {
            logger.error('HTTP Request failed:', error);
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

    static async fetchLumosLogs(playerName: string, executorId: string): Promise<any | null> {
        try {
            const headers = {
                'player': playerName,
                'LumosKey': this.LUMOS_KEY,
                'mode': 'VIEW_LOGS',
                'executor': executorId
            };

            const response = await this.getResponse(`${this.BASE_URL}/`, headers);
            return response ? JSON.parse(response) : null;
        } catch (error) {
            logger.error('Failed to fetch Lumos logs:', error);
            return null;
        }
    }
} 