// SharedExperienceCard.tsx
import { Button } from "@/components/ui/button";
import type { ISharedExperience } from "@/types/activity-types";
import Image from "next/image";

export function SharedExperienceCard({
  experience,
}: {
  experience: ISharedExperience;
}) {
  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-primary">
          {experience.name}
        </h3>
        {/* TODO: Implement "All media" button functionality */}
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
        >
          All media
        </Button>
      </div>
      {/* Image Grid - Ensure responsiveness */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {experience.images && Array.isArray(experience.images) ? ( // Add this check
          experience.images.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="aspect-square rounded-md overflow-hidden bg-muted"
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Experience image ${index + 1}`}
                className="w-full h-full object-cover"
                width={150}
                height={150}
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center text-muted-foreground py-4">
            No media available. {/* Optional: Display a message if no images */}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {experience.description}
      </p>
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Shared by:</span>
        <span className="font-medium">
          {experience.user?.firstname} {experience.user?.lastname}
        </span>
      </div>
    </div>
  );
}
