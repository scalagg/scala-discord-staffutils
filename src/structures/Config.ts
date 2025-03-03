export interface Config {
    bot: {
        token: string;
        clientId: string;
    };
    apis: {
        v4guard: {
            key: string;
            baseUrl: string;
        };
        tebex: {
            key: string;
            baseUrl: string;
        };
        anticheat: {
            key: string;
            baseUrl: string;
            panelUrl: string;
            panelKey: string;
        };
    };
} 