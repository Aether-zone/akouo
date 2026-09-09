import { Input, type InputProps } from "@aether-zone/kosmos";

export type NumberInputProps = Omit<InputProps, "type">;

/**
 * Numeric field — a native `type="number"` variant of kosmos's Input.
 *
 * Built on the component rather than on a shared class string: the styling now
 * belongs to kosmos, and reaching for its internals would put this back in the
 * business of tracking them.
 */
export function NumberInput({ className, ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      className={className}
      {...props}
    />
  );
}
