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
        tebex?: string;
        lumosKey?: string;
    };
} 