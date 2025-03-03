import axios from 'axios';

export async function getMinecraftSkin(username: string): Promise<string | null> {
    try {
        const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        const uuid = response.data.id;

        if (uuid) {
            const skinResponse = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
            const skinUrl = skinResponse.data.properties[0].value; // This will need to be decoded from base64
            return `https://starlightskins.lunareclipse.studio/render/mojavatar/${uuid}/full`; 
        }
    } catch (error) {
        console.error('Error fetching Minecraft skin:', error);
    }
    return null;
} 