import chalk from 'chalk';

const debugMode = true; // We'll make this configurable later

export const logger = {
    info: (message: string) => console.log(chalk.blue('ℹ'), message),
    success: (message: string) => console.log(chalk.green('✓'), message),
    warning: (message: string) => console.log(chalk.yellow('⚠'), message),
    error: (message: string, error?: any) => {
        console.error(chalk.red('✖'), message);
        if (error) {
            console.error(chalk.red('  →'), error);
            if (error.stack) {
                console.error(chalk.red('  Stack:'), error.stack);
            }
        }
    },
    debug: (message: string) => {
        if (debugMode) {
            console.log(chalk.gray('🔍'), message);
        }
    },
    startup: (message: string) => console.log(chalk.cyan('🚀'), message),
    database: (message: string) => console.log(chalk.magenta('🗄'), message),
    command: (message: string) => console.log(chalk.yellow('⌘'), message),
    event: (message: string) => console.log(chalk.blue('📡'), message),
    divider: () => console.log(chalk.gray('─'.repeat(50))),
}; 