import Redis from 'ioredis';

const redis = new Redis({
    host: 'localhost',
    port: '6379',
    db: 0,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) {
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
    }
});

let isRedisAvailable = false;

redis.on('error', (err) => {
    console.error('Redis error:', err);
    isRedisAvailable = false;
});

redis.on('connect', () => {
    console.log('✓ Redis connected');
    isRedisAvailable = true;
});

redis.on('close', () => {
    console.log('Redis connection closed');
    isRedisAvailable = false;
});

// Fonction pour tenter une reconnexion
const attemptReconnect = async (): Promise<boolean> => {
    if (isRedisAvailable || redis.status === 'ready' || redis.status === 'connecting') {
        return isRedisAvailable;
    }

    try {
        console.log('Tentative de reconnexion à Redis...');
        await redis.connect();
        return true;
    } catch (error) {
        // La reconnexion a échoué, on continue sans cache
        return false;
    }
};

// Helper functions pour gérer Redis de manière sûre avec reconnexion automatique
export const safeRedisGet = async (key: string): Promise<string | null> => {
    // Tenter de se reconnecter si nécessaire
    await attemptReconnect();

    if (!isRedisAvailable || redis.status !== 'ready') {
        return null;
    }
    try {
        return await redis.get(key);
    } catch (error) {
        console.warn('Redis unavailable, skipping cache read:', error.message);
        isRedisAvailable = false;
        return null;
    }
};

export const safeRedisSetex = async (key: string, seconds: number, value: string): Promise<void> => {
    // Tenter de se reconnecter si nécessaire
    await attemptReconnect();

    if (!isRedisAvailable || redis.status !== 'ready') {
        return;
    }
    try {
        await redis.setex(key, seconds, value);
    } catch (error) {
        console.warn('Redis unavailable, skipping cache write:', error.message);
        isRedisAvailable = false;
    }
};

export const safeRedisDel = async (key: string): Promise<void> => {
    // Tenter de se reconnecter si nécessaire
    await attemptReconnect();

    if (!isRedisAvailable || redis.status !== 'ready') {
        return;
    }
    try {
        await redis.del(key);
    } catch (error) {
        console.warn('Redis unavailable, skipping cache delete:', error.message);
        isRedisAvailable = false;
    }
};

export default redis;
