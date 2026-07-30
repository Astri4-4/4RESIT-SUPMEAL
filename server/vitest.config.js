import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.test.js'],
        testTimeout: 15000,
        // Integration suites share one real Postgres DB and one real Redis
        // instance (rate limiter keys, uploaded files). fileParallelism
        // alone still leaves a window where one file's in-flight requests
        // can land after another file's rate-limit reset, so force a single
        // worker/process with no overlap at all.
        fileParallelism: false,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
});
