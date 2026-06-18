interface Step {
  title: string;
  description: string;
  isCompleted: boolean;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function Steps({ steps, currentStep, onStepClick }: StepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="relative flex-1">
            {/* Line connector */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 ${
                  currentStep > index + 1 || step.isCompleted
                    ? "bg-primary"
                    : "bg-gray-200"
                }`}
              />
            )}

            {/* Step button */}
            <button
              onClick={() => onStepClick(index + 1)}
              className="relative flex flex-col items-center"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  currentStep === index + 1
                    ? "border-primary bg-primary text-white"
                    : step.isCompleted
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {step.isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <div className="absolute -bottom-8 w-32 text-center">
                <p
                  className={`text-sm font-medium ${
                    currentStep === index + 1 ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
