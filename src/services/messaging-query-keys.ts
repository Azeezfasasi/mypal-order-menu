export const MESSAGING_QUERY_KEYS = {
    all: ["business-messages"] as const,
    list: (params?: Record<string, unknown>) =>
        [...MESSAGING_QUERY_KEYS.all, params] as const,
    single: (id: string | number) => [...MESSAGING_QUERY_KEYS.all, id]
};
