import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('../../src/database/db.js', () => ({
    query: vi.fn(),
}));

import {query} from '../../src/database/db.js';
import {createStep, clearRecipeSteps} from '../../src/services/step.service.js';

beforeEach(() => {
    query.mockReset();
});

describe('createStep', () => {
    it('inserts recipe_id, step_number, and description', async () => {
        query.mockResolvedValue({rows: []});

        await createStep(3, {step_number: 1, description: 'Preheat the oven'});

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/INSERT INTO recipe_steps \(recipe_id, step_number, description\)/);
        expect(params).toEqual([3, 1, 'Preheat the oven']);
    });

    it('propagates errors from the query', async () => {
        query.mockRejectedValue(new Error('constraint violation'));

        await expect(createStep(3, {step_number: 1, description: 'x'})).rejects.toThrow('constraint violation');
    });
});

describe('clearRecipeSteps', () => {
    it('deletes all recipe_steps rows for the given recipe id', async () => {
        query.mockResolvedValue({rows: []});

        await clearRecipeSteps(3);

        const [sql, params] = query.mock.calls[0];
        expect(sql).toMatch(/DELETE FROM recipe_steps WHERE recipe_id = \$1/);
        expect(params).toEqual([3]);
    });
});
