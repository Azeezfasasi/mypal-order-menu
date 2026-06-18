"use client";

import { cn } from "@/lib/utils";
import { Step } from "../types";
import { getStepDisplayName } from "../utils";

interface StepIndicatorProps {
  currentStep: Step;
  availableSteps: Step[];
  stepErrors: { [stepName: string]: { [fieldName: string]: string } };
  progress: number;
  size?: "sm" | "md" | "lg";
  showSummary?: boolean;
  hideSteps?: boolean;
}

// Centralized size configuration
const SIZE_CONFIG = {
  sm: {
    container: "mb-6 px-2",
    progressLine: "h-0.5",
    progressTop: "top-4",
    stepCircle: "h-8 w-8",
    stepText: "text-xs",
    errorBadge: "h-4 w-4 text-xs",
    statusIndicator: "h-0.5 w-3",
    summary: {
      base: "text-xs px-3 py-1.5",
      marginWhenStepsVisible: "mt-4",
      marginWhenStepsHidden: "mt-0",
    },
    summaryDot: "h-1.5 w-1.5",
    maxWidth: "max-w-3xl",
    spacing: "mb-2",
    stepLabelWidth: "max-w-20",
    checkIcon: "h-4 w-4",
  },
  md: {
    container: "mb-10 px-4",
    progressLine: "h-1",
    progressTop: "top-6",
    stepCircle: "h-12 w-12",
    stepText: "text-xs",
    errorBadge: "h-6 w-6 text-xs",
    statusIndicator: "h-1 w-4",
    summary: {
      base: "text-sm px-4 py-2",
      marginWhenStepsVisible: "mt-6",
      marginWhenStepsHidden: "mt-0",
    },
    summaryDot: "h-2 w-2",
    maxWidth: "max-w-4xl",
    spacing: "mb-3",
    stepLabelWidth: "max-w-20",
    checkIcon: "h-5 w-5",
  },
  lg: {
    container: "mb-12 px-6",
    progressLine: "h-1.5",
    progressTop: "top-8",
    stepCircle: "h-16 w-16",
    stepText: "text-sm",
    errorBadge: "h-8 w-8 text-sm",
    statusIndicator: "h-1.5 w-5",
    summary: {
      base: "text-base px-5 py-3",
      marginWhenStepsVisible: "mt-8",
      marginWhenStepsHidden: "mt-0",
    },
    summaryDot: "h-2.5 w-2.5",
    maxWidth: "max-w-5xl",
    spacing: "mb-4",
    stepLabelWidth: "max-w-24",
    checkIcon: "h-7 w-7",
  },
} as const;

// Step state styling configuration
const STEP_STATE_STYLES = {
  completed:
    "bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-green-200 shadow-md",
  active:
    "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 text-white shadow-orange-200 shadow-lg ring-4 ring-orange-100",
  error:
    "bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white shadow-red-200 shadow-md",
  pending:
    "bg-white border-gray-300 text-gray-500 shadow-sm hover:border-gray-400",
  default: "bg-gray-100 border-gray-300 text-gray-600 shadow-sm",
} as const;

// Text color configuration for step labels
const STEP_LABEL_COLORS = {
  active: "text-orange-700 font-semibold",
  error: "text-red-600 font-semibold",
  completed: "text-green-700",
  default: "text-gray-600 group-hover:text-gray-800",
} as const;

export const StepIndicator = ({
  currentStep,
  availableSteps,
  stepErrors,
  progress,
  size = "md",
  showSummary = true,
  hideSteps = false,
}: StepIndicatorProps) => {
  const config = SIZE_CONFIG[size];
  const currentStepIndex = availableSteps.indexOf(currentStep);

  const getStepErrorCount = (step: Step): number => {
    return stepErrors[step] ? Object.keys(stepErrors[step]).length : 0;
  };

  const getStepState = (step: Step, index: number) => {
    const isActive = currentStep === step;
    const isCompleted = currentStepIndex > index;
    const isPending = currentStepIndex < index;
    const errorCount = getStepErrorCount(step);
    const hasErrors = errorCount > 0;

    return {
      isActive,
      isCompleted,
      isPending,
      hasErrors,
      errorCount,
    };
  };

  const getStepCircleStyles = (state: ReturnType<typeof getStepState>) => {
    const { isActive, isCompleted, isPending, hasErrors } = state;

    if (isCompleted) return STEP_STATE_STYLES.completed;
    if (isActive) return STEP_STATE_STYLES.active;
    if (hasErrors && !isActive && !isCompleted) return STEP_STATE_STYLES.error;
    if (isPending) return STEP_STATE_STYLES.pending;
    return STEP_STATE_STYLES.default;
  };

  const getStepLabelColor = (state: ReturnType<typeof getStepState>) => {
    const { isActive, isCompleted, hasErrors } = state;

    if (isActive) return STEP_LABEL_COLORS.active;
    if (hasErrors) return STEP_LABEL_COLORS.error;
    if (isCompleted) return STEP_LABEL_COLORS.completed;
    return STEP_LABEL_COLORS.default;
  };

  const renderStepContent = (
    state: ReturnType<typeof getStepState>,
    index: number
  ) => {
    if (state.isCompleted) {
      return (
        <svg
          className={config.checkIcon}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return <span>{index + 1}</span>;
  };

  const renderErrorBadge = (errorCount: number) => (
    <div
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-lg ring-2 ring-white animate-bounce",
        config.errorBadge
      )}
    >
      {errorCount > 9 ? "9+" : errorCount}
    </div>
  );

  const renderCompletionSparkles = () => (
    <div className="absolute inset-0 rounded-full">
      <div
        className="absolute top-0 left-1/2 h-1 w-1 bg-white rounded-full opacity-80 animate-ping"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="absolute top-1/4 right-0 h-0.5 w-0.5 bg-white rounded-full opacity-60 animate-ping"
        style={{ animationDelay: "200ms" }}
      />
      <div
        className="absolute bottom-1/4 left-0 h-0.5 w-0.5 bg-white rounded-full opacity-40 animate-ping"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );

  const renderStatusIndicator = (state: ReturnType<typeof getStepState>) => {
    const { isActive, isCompleted, hasErrors, errorCount } = state;

    if (isActive) {
      return (
        <div
          className={cn(config.statusIndicator, "bg-orange-400 rounded-full")}
        />
      );
    }

    if (hasErrors && !isActive) {
      return (
        <div className={cn(config.stepText, "text-red-500 font-medium")}>
          {errorCount} error{errorCount > 1 ? "s" : ""}
        </div>
      );
    }

    if (isCompleted && !hasErrors) {
      return (
        <div
          className={cn(config.stepText, "text-green-600 font-medium text-xs")}
        >
          Complete
        </div>
      );
    }

    return null;
  };

  const totalErrors = Object.values(stepErrors).reduce(
    (acc, errs) => acc + Object.keys(errs).length,
    0
  );

  const completedStepsCount = availableSteps.filter(
    (_, idx) => idx < currentStepIndex
  ).length;

  return (
    <div className={config.container}>
      {!hideSteps && (
        <div className={cn("relative mx-auto", config.maxWidth)}>
          {/* Progress line background */}
          <div
            className={cn(
              "absolute left-0 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full shadow-inner",
              config.progressLine,
              config.progressTop
            )}
          />

          {/* Animated progress line */}
          <div
            className={cn(
              "absolute left-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-full shadow-lg transition-all duration-700 ease-out",
              config.progressLine,
              config.progressTop
            )}
            style={{ width: `${Math.max(progress, 8)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full opacity-60 blur-sm" />
          </div>

          {/* Step indicators */}
          <div className="relative z-10 flex justify-between">
            {availableSteps.map((step, index) => {
              const state = getStepState(step, index);
              const stepCircleStyles = getStepCircleStyles(state);
              const stepLabelColor = getStepLabelColor(state);

              return (
                <div
                  key={step}
                  className="flex flex-col items-center group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Step ${index + 1}: ${getStepDisplayName(step)}${
                    state.hasErrors
                      ? ` (${state.errorCount} error${
                          state.errorCount > 1 ? "s" : ""
                        })`
                      : ""
                  }${
                    state.isActive
                      ? " (current)"
                      : state.isCompleted
                      ? " (completed)"
                      : ""
                  }`}
                >
                  {/* Step circle container */}
                  <div className={cn("relative", config.spacing)}>
                    {/* Outer glow ring for active step */}
                    {state.isActive && (
                      <div className="absolute inset-0 rounded-full bg-orange-400 opacity-30 scale-150 animate-pulse" />
                    )}

                    {/* Main step circle */}
                    <div
                      className={cn(
                        "relative flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-out font-semibold group-hover:scale-110 group-hover:shadow-lg",
                        config.stepCircle,
                        config.stepText,
                        stepCircleStyles
                      )}
                    >
                      {renderStepContent(state, index)}
                    </div>

                    {/* Error badge */}
                    {state.hasErrors && renderErrorBadge(state.errorCount)}

                    {/* Completion sparkle effect */}
                    {state.isCompleted && renderCompletionSparkles()}
                  </div>

                  {/* Step label */}
                  <div className={cn("text-center", config.stepLabelWidth)}>
                    <span
                      className={cn(
                        config.stepText,
                        "font-medium leading-tight transition-colors duration-300",
                        stepLabelColor
                      )}
                    >
                      {getStepDisplayName(step)}
                    </span>

                    {/* Status indicator */}
                    <div className="mt-1 flex justify-center">
                      {renderStatusIndicator(state)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress summary */}
      {showSummary && (
        <div
          className={cn(
            "flex items-center space-x-4 text-gray-600 bg-gray-50 rounded-lg",
            config.summary.base,
            hideSteps
              ? config.summary.marginWhenStepsHidden
              : config.summary.marginWhenStepsVisible
          )}
        >
          <span className="flex items-center">
            <div
              className={cn(
                config.summaryDot,
                "bg-green-500 rounded-full mr-2"
              )}
            />
            {completedStepsCount} completed
          </span>

          <span className="flex items-center">
            <div
              className={cn(
                config.summaryDot,
                "bg-orange-500 rounded-full mr-2"
              )}
            />
            Step {currentStepIndex + 1} of {availableSteps.length}
          </span>

          {totalErrors > 0 && (
            <span className="flex items-center text-red-600">
              <div
                className={cn(
                  config.summaryDot,
                  "bg-red-500 rounded-full mr-2"
                )}
              />
              {totalErrors} errors
            </span>
          )}
        </div>
      )}
    </div>
  );
};
