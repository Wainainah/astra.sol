"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormProgressProps {
  fields: {
    name: string;
    label: string;
    isValid: boolean;
    isRequired: boolean;
  }[];
}

export function FormProgress({ fields }: FormProgressProps) {
  const requiredFields = fields.filter((f) => f.isRequired);
  const completedRequired = requiredFields.filter((f) => f.isValid).length;
  const totalRequired = requiredFields.length;
  const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Form Progress</span>
          <span>{completedRequired}/{totalRequired} required</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Field checklist */}
      <div className="flex flex-wrap gap-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors",
              field.isValid
                ? "bg-green-500/10 text-green-600"
                : field.isRequired
                ? "bg-muted text-muted-foreground"
                : "bg-muted/50 text-muted-foreground/60"
            )}
          >
            {field.isValid ? (
              <Check className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            <span>{field.label}</span>
            {field.isRequired && !field.isValid && (
              <span className="text-destructive">*</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
