import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction,
    type AutocompleteInteraction
} from 'discord.js';

export interface CommandOptions {
    name: string;
    description: string;
    roleIds?: string[];
    cooldown?: number;
    category?: string;
    guildOnly?: boolean;
}

export abstract class Command {
    public name: string;
    public description: string;
    public roleIds: string[];
    public cooldown: number;
    public category: string;
    public guildOnly: boolean;
    public data: SlashCommandBuilder;

    constructor(options: CommandOptions) {
        this.name = options.name;
        this.description = options.description;
        this.roleIds = options.roleIds || [];
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