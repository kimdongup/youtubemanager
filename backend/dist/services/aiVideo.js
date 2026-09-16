"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiVideoService = exports.SUPPORTED_AI_TOOLS = void 0;
const database_js_1 = require("../db/database.js");
exports.SUPPORTED_AI_TOOLS = [
    {
        id: 'runway-gen3',
        name: 'Runway Gen-3 Alpha',
        category: 'High Cinematic & Realistic Motion',
        recommendedPrompts: [
            'Cinematic slow pan from left to right, high dynamic range, 4k ultra detailed motion, photorealistic lighting',
            'Gentle zoom in on the subject, dramatic atmospheric mist, film grain, hyper-realistic physics',
            'Smooth orbit camera rotation, soft volumetric morning rays, dynamic particle motion'
        ]
    },
    {
        id: 'luma-dream-machine',
        name: 'Luma Dream Machine',
        category: 'Dynamic Camera & 3D Consistency',
        recommendedPrompts: [
            'FPV drone sweep forward across the scene, cinematic motion blur, natural fluid movement',
            'Dramatic low-angle dolly zoom, rich textures, seamless natural evolution of the shot',
            'Fast action dynamic pan with realistic physics and consistent lighting transitions'
        ]
    },
    {
        id: 'kling-ai',
        name: 'Kling AI',
        category: 'Expressive Characters & Long Coherence',
        recommendedPrompts: [
            'Subtle breathing motion, wind blowing hair and clothes gently, warm sunset backlight, photorealistic micro-expressions',
            'Character turns head towards camera and smiles slightly, natural soft studio lighting',
            'Time-lapse transition from daytime golden hour to starry dusk, cinematic 8k'
        ]
    },
    {
        id: 'openai-sora',
        name: 'OpenAI Sora',
        category: 'Ultra-Realism & Complex Multi-Subject',
        recommendedPrompts: [
            'Complex multi-agent movement, photorealistic environment reflection and depth of field, slow steadycam forward track',
            'Cinematic documentary style handheld camera, ultra-detailed textures and fluid transitions'
        ]
    }
];
exports.aiVideoService = {
    getAvailableTools() {
        return exports.SUPPORTED_AI_TOOLS;
    },
    generatePromptSuggestion(fileName, toolId) {
        const tool = exports.SUPPORTED_AI_TOOLS.find(t => t.id === toolId) || exports.SUPPORTED_AI_TOOLS[0];
        const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const randomTemplate = tool.recommendedPrompts[Math.floor(Math.random() * tool.recommendedPrompts.length)];
        return `Subject: "${cleanName}". ${randomTemplate}`;
    },
    async mapGeneratedVideoToImage(imageId, mappedVideoPath) {
        const item = database_js_1.dbService.getMediaItemById(imageId);
        if (!item) {
            throw new Error(`Media item ${imageId} not found`);
        }
        database_js_1.dbService.updateMediaAIVideo(imageId, item.ai_tool, item.ai_prompt, mappedVideoPath);
        return database_js_1.dbService.getMediaItemById(imageId);
    }
};
