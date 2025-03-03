import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction,
    type PermissionResolvable,
    type AutocompleteInteraction
} from 'discord.js';

export interface CommandOptions {
    name: string;
    description: string;
    permissions?: PermissionResolvable[];
    cooldown?: number;
    category?: string;
    guildOnly?: boolean;
}

export abstract class Command {
    public name: string;
    public description: string;
    public permissions: PermissionResolvable[];
    public cooldown: number;
    public category: string;
    public guildOnly: boolean;
    public data: SlashCommandBuilder;

    constructor(options: CommandOptions) {
        this.name = options.name;
        this.description = options.description;
        this.permissions = options.permissions || [];
        this.cooldown = options.cooldown || 0;
        this.category = options.category || 'Miscellaneous';
        this.guildOnly = options.guildOnly || false;
        
        this.data = new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description);
    }

    abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;
    
    // Optional method for autocomplete
    async autocomplete?(interaction: AutocompleteInteraction): Promise<void> {}
} 