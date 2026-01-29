/**
 * Utility function to add timeout to promises
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

/**
 * Safe promise execution with error handling
 */
export async function safePromise<T>(
    promise: () => Promise<T>,
    fallback?: T
): Promise<{ data?: T; error?: Error }> {
    try {
        const data = await promise();
        return { data };
    } catch (error) {
        return { 
            error: error instanceof Error ? error : new Error(String(error)) 
        };
    }
}