import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

export interface ZodValidationIssue {
  path: string;
  message: string;
}

/**
 * Validates a handler argument against a zod schema.
 *
 * Bind it to the argument you want validated, so it only sees that value:
 *
 *   @Post()
 *   createPerson(@Body(new ZodValidationPipe(createPersonSchema)) person: CreatePersonDTO) { }
 *
 * The parsed value is what reaches the handler, so unknown keys are stripped
 * and any schema defaults or transforms are applied.
 */
@Injectable()
export class ZodValidationPipe<TOutput = unknown, TInput = unknown>
  implements PipeTransform<unknown, TOutput>
{
  constructor(private readonly schema: ZodType<TOutput, TInput>) {}

  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.toIssues(result.error),
      });
    }

    return result.data;
  }

  private toIssues(error: ZodError): ZodValidationIssue[] {
    return error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }
}
