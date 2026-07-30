import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.test.js'],
        testTimeout: 15000,
        // Integration suites share one real Postgres DB and one real Redis
        // instance (rate limiter keys, uploaded files). Running test files
        // in parallel lets them stomp on each other's shared state, so they
        // run sequentially instead.
        fileParallelism: false,
    },
});
