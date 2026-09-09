import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    nickname: z.string().optional(),
  });

  it('returns the parsed value when input is valid', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ firstName: 'Alice', lastName: 'Smith' })).toEqual({
      firstName: 'Alice',
      lastName: 'Smith',
    });
  });

  it('strips keys that are not in the schema', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(
      pipe.transform({ firstName: 'Alice', lastName: 'Smith', id: 'injected' }),
    ).toEqual({ firstName: 'Alice', lastName: 'Smith' });
  });

  it('applies schema defaults and transforms', () => {
    const pipe = new ZodValidationPipe(
      z.object({ status: z.string().default('draft') }),
    );

    expect(pipe.transform({})).toEqual({ status: 'draft' });
  });

  it('throws BadRequestException listing every issue', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform({ firstName: 42 })).toThrow(
      BadRequestException,
    );

    try {
      pipe.transform({ firstName: 42 });
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        errors: { path: string; message: string }[];
      };

      expect(response.message).toBe('Validation failed');
      expect(response.errors.map(({ path }) => path).sort()).toEqual([
        'firstName',
        'lastName',
      ]);
      expect(response.errors.every(({ message }) => message.length > 0)).toBe(
        true,
      );
    }
  });

  it('reports nested paths dot-joined', () => {
    const pipe = new ZodValidationPipe(
      z.object({ address: z.object({ city: z.string() }) }),
    );

    try {
      pipe.transform({ address: {} });
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        errors: { path: string }[];
      };

      expect(response.errors[0].path).toBe('address.city');
    }
  });
});
