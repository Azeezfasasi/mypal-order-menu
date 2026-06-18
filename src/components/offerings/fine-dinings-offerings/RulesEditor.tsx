"use client";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CancellationRule,
  CreateCancellationPolicyDto,
} from "@/services/api/cancellation-policy-api";
import { ArrowDown, ArrowUp, Trash } from "lucide-react";
import { useState } from "react";
import {
  Control,
  useFieldArray,
  UseFormRegister,
  useFormState,
} from "react-hook-form";

interface RulesEditorProps {
  control: Control<CreateCancellationPolicyDto>;
  register: UseFormRegister<CreateCancellationPolicyDto>;
}

export default function RulesEditor({ control, register }: RulesEditorProps) {
  const { fields, append, remove, move } = useFieldArray<
    CreateCancellationPolicyDto,
    "rules"
  >({ control, name: "rules" });

  // Read validation errors for the rules array
  const { errors } = useFormState({ control, name: "rules" });

  // index of rule pending delete confirmation
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <div className="text-sm text-gray-500">
          No rules added yet. Use &apos;Add rule&apos; to create one.
        </div>
      )}

      {fields.map((field, index) => {
        const rule = field as unknown as CancellationRule & { id?: string };
        return (
          <div
            key={field.id}
            className="grid grid-cols-12 gap-2 items-start p-3 border rounded"
          >
            <div className="col-span-12 md:col-span-6">
              <label className="text-xs font-medium text-gray-600">
                Timeframe
              </label>
              <Input
                {...register(`rules.${index}.timeframe` as const, {
                  required: "Timeframe is required",
                })}
                defaultValue={rule.timeframe || ""}
                placeholder="e.g. More than 72 hours before the event"
              />
              {errors?.rules?.[index]?.timeframe && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.rules[index].timeframe?.message as string}
                </p>
              )}
            </div>

            <div className="col-span-6 md:col-span-3">
              <label className="text-xs font-medium text-gray-600">
                Refund %
              </label>
              <Input
                {...register(`rules.${index}.refundPercentage` as const, {
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be >= 0" },
                  max: { value: 100, message: "Must be <= 100" },
                })}
                defaultValue={rule.refundPercentage ?? ""}
                type="number"
                min={0}
                max={100}
                placeholder="100"
              />
              {errors?.rules?.[index]?.refundPercentage && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.rules[index].refundPercentage?.message as string}
                </p>
              )}
            </div>

            <div className="col-span-6 md:col-span-3">
              <label className="text-xs font-medium text-gray-600">
                Cancellation Fee
              </label>
              <Input
                {...register(`rules.${index}.cancellationFee` as const)}
                defaultValue={rule.cancellationFee || ""}
                placeholder="No cancellation fee applies"
              />
            </div>

            <div className="col-span-12 flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => index > 0 && move(index, index - 1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  index < fields.length - 1 && move(index, index + 1)
                }
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmIndex(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
              <div className="ml-3 text-sm text-gray-500">Rule {index + 1}</div>
            </div>
          </div>
        );
      })}

      <div>
        <Button
          onClick={() =>
            append({
              timeframe: "",
              cancellationFee: "",
              refundPercentage: 100,
              sortOrder: fields.length + 1,
            } as CancellationRule)
          }
          size="sm"
          className="bg-orange-100 text-primary"
        >
          Add rule
        </Button>
      </div>

      {/* ConfirmDeleteDialog rendered outside map so it is single instance */}
      {confirmIndex !== null && (
        <ConfirmDeleteDialog
          open={confirmIndex !== null}
          onClose={() => setConfirmIndex(null)}
          onConfirm={() => {
            if (confirmIndex !== null) {
              remove(confirmIndex);
              setConfirmIndex(null);
            }
          }}
          title={`Delete Rule ${confirmIndex + 1}`}
          description="This action cannot be undone."
        />
      )}
    </div>
  );
}

// This function is not used, it's here to satisfy the requirement of having a single export
export function __RulesEditorConfirmPlaceholder() {
  return null;
}
