export interface BotConfig {
    bot: {
        token: string;
        clientId: string;
    };
    database: {
        mongodb: {
            uri: string;
        };
        redis: {
            uri: string;
        };
    };
    api: {
        weather?: string;
        // Add other API keys here
    };
} 