"use client";

import {
    Field,
    FieldDescription,
    FieldError,
    Label,
} from "@aether-zone/kosmos";
import { useId, type ReactNode } from "react";

/**
 * A labelled form control, wired for accessibility.
 *
 * Kosmos ships the pieces — `Field`, `Label`, `FieldDescription`,
 * `FieldError` — but composing them leaves the caller to invent an id, point
 * the label at it, and thread `aria-describedby` and `aria-invalid` back to the
 * control. Thirteen call sites doing that by hand is thirteen chances to wire
 * it wrong and no way to notice, since the markup still looks right.
 *
 * So this keeps the render-prop shape the app already used: whatever the
 * control needs to be correctly described arrives as one object to spread.
 */
export type FormFieldRenderProps = {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
};

export function FormField({
    label,
    description,
    error,
    required,
    children,
}: {
    label?: ReactNode;
    description?: ReactNode;
    error?: string;
    required?: boolean;
    children: (field: FormFieldRenderProps) => ReactNode;
}) {
    const id = useId();
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    /*
     * The error is named first: a screen reader reaching an invalid control
     * should hear why before it hears the hint it already failed to follow.
     */
    const describedBy =
        [error && errorId, description && descriptionId]
            .filter(Boolean)
            .join(" ") || undefined;

    return (
        <Field>
            {label && (
                <Label htmlFor={id}>
                    {label}
                    {required && (
                        <span aria-hidden="true" className="text-destructive">
                            {" *"}
                        </span>
                    )}
                </Label>
            )}

            {children({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": error ? true : undefined,
            })}

            {description && (
                <FieldDescription id={descriptionId}>
                    {description}
                </FieldDescription>
            )}

            {/* `role="alert"` so a validation failure is announced when it
                appears, rather than only on the next visit to the field. */}
            {error && (
                <FieldError id={errorId} role="alert">
                    {error}
                </FieldError>
            )}
        </Field>
    );
}
