import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function loadEvents(client: Client) {
    const eventsPath = join(__dirname, '..', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

    for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        const event = (await import(filePath)).default;

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        logger.event(`Loaded event: ${event.name}`);
    }
} 