import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { logger } from './logger.js';

interface LumosLog {
    checkType: string;
    checkViolation: number;
    ping: number;
    checkData: string;
    experimental: boolean;
    checkName: string;
}

export class HTTPUtil {
    private static readonly BASE_URL = 'https://backend.antiskid.club';
    private static readonly LUMOS_KEY = 'Solara-FUCKTOPU40M64X266190JOK77Q7N1633S7';
    private static readonly PASTE_URL = 'https://pastes.dev/api/v1/pastes';

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

    private static formatLog(log: LumosLog): string {
        return [
            `Check: ${log.checkName} (${log.checkType})`,
            `Violation: ${log.checkViolation}`,
            `Ping: ${log.ping}ms`,
            `Experimental: ${log.experimental}`,
            `Data: ${log.checkData}`,
            '----------------------------------------'
        ].join('\n');
    }

    private static async createPaste(content: string, executorId: string): Promise<string | null> {
        try {
            logger.debug('Attempting to create paste with content length: ' + content.length);
            
            // Convert content to Base64
            const base64Content = Buffer.from(content).toString('base64');
            
            // Create form data
            const formData = new URLSearchParams();
            formData.append('data', base64Content);

            const response = await axios({
                method: 'post',
                url: 'https://panel.antiskid.club/endpoint/upload',
                data: formData,
                headers: {
                    'User-Agent': 'Lumos Client/1.0',
                    'pass': 'bc29bcf6-b837-4d39-a45a-d5ba1d4f9197',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            logger.debug(`Paste creation response status: ${response.status}`);
            logger.debug(`Paste creation response data: ${response.data}`);

            if (response.status === 200 && response.data) {
                const pasteUrl = `https://panel.antiskid.club/paste?id=${response.data}`;
                logger.debug(`Successfully created paste: ${pasteUrl}`);
                return pasteUrl;
            }

            logger.error('Failed to create paste:', response.data);
            return null;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('Paste creation error:', {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
            } else {
                logger.error('Unknown paste creation error:', error);
            }
            return null;
        }
    }

    static async fetchLumosLogs(playerName: string, executorId: string): Promise<any | null> {
        try {
            const uuid = await global.redisClient.hGet('DataStore:UuidCache:Username', playerName.toLowerCase());
            
            if (!uuid) {
                logger.debug(`No UUID found for player: ${playerName}`);
                return null;
            }

            logger.debug(`Found UUID for ${playerName}: ${uuid}`);

            const url = `${this.BASE_URL}/api?license=${this.LUMOS_KEY}&type=logs&uuid=${uuid}`;
            logger.debug(`Making GET request to: ${url}`);

            const response = await axios({
                method: 'get',
                url: url,
                timeout: 20000,
                validateStatus: null
            });

            logger.debug(`Lumos API response status: ${response.status}`);
            logger.debug(`Lumos API response type: ${typeof response.data}`);

            // Check for valid response and Logs array
            if (response.status !== 200 || !response.data?.Logs || !Array.isArray(response.data.Logs)) {
                logger.error('Invalid response from Lumos API:', {
                    status: response.status,
                    dataType: typeof response.data,
                    data: response.data
                });
                return null;
            }

            const logs = response.data.Logs;
            logger.debug(`Found ${logs.length} logs`);

            // Format logs
            const formattedLogs = logs.map((log: LumosLog) => this.formatLog(log));
            const fullContent = [
                `Anticheat Logs`,
                `Generated at: ${new Date().toLocaleString()}`,
                `Generated by: ${executorId}`,
                `Total Violations: ${logs.length}`,
                '',
                ...formattedLogs
            ].join('\n');

            logger.debug('Attempting to create paste...');
            const pasteUrl = await this.createPaste(fullContent, executorId);
            
            if (!pasteUrl) {
                logger.error('Failed to create paste, but logs were retrieved');
                return {
                    logs: logs,
                    pasteUrl: null
                };
            }

            const formattedPasteUrl = `\`${pasteUrl}\``;
            
            logger.debug('Successfully created paste and retrieved logs');
            return {
                logs: logs,
                pasteUrl: formattedPasteUrl
            };

        } catch (error) {
            logger.error('Error in fetchLumosLogs:', error);
            return null;
        }
    }
} 