// SharedActivitiesPage.tsx
"use client";

import { Loader2 } from "lucide-react";

import { LikesCountView } from "@/components/shared-activities/LikesCountView";
import { PaginationControls } from "@/components/shared-activities/PaginationControls";
import { SharedExperienceCard } from "@/components/shared-activities/SharedExperienceCard";
import { SharedPageCard } from "@/components/shared-activities/SharedPageCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { BusinessSharedActivityApi } from "@/services/api/shared-activities-api";
import type {
  ILikeActivityItem,
  IShareActivityItem,
  ISharedExperience,
} from "@/types/activity-types";

export default function SharedActivitiesPage() {
  // --- Likes Pagination ---
  const likesItemsPerPage = 6;
  const likesApiResponse = BusinessSharedActivityApi.useGetBusinessLikes;
  const {
    data: likesData,
    isLoading: isLoadingLikes,
    error: likesError,
  } = likesApiResponse(1, likesItemsPerPage);
  const likesTotal = likesData?.data.total || 0;
  const allLikes: ILikeActivityItem[] = likesData?.data.data || [];
  const likesPagination = usePagination([], likesTotal, likesItemsPerPage);

  // --- Shared Pages Pagination ---
  const pagesItemsPerPage = 10;
  const pagesApiResponse = BusinessSharedActivityApi.useGetBusinessShares;
  const {
    data: sharedPagesData,
    isLoading: isLoadingSharedPages,
    error: sharedPagesError,
  } = pagesApiResponse(1, pagesItemsPerPage);
  const sharedPagesTotal = sharedPagesData?.data.total || 0;

  const allSharedPages: IShareActivityItem[] = sharedPagesData?.data.data || [];
  const pagesPagination = usePagination(
    [],
    sharedPagesTotal,
    pagesItemsPerPage
  );

  // --- Shared Experiences Pagination ---
  const experiencesItemsPerPage = 6;
  const experiencesApiResponse =
    BusinessSharedActivityApi.useGetBusinessSharesExperiences;
  const {
    data: sharedExperiencesData,
    isLoading: isLoadingSharedExperiences,
    error: sharedExperiencesError,
  } = experiencesApiResponse(1, experiencesItemsPerPage);
  const sharedExperiencesTotal = sharedExperiencesData?.data.total || 0;
  const allSharedExperiences: ISharedExperience[] =
    sharedExperiencesData?.data.data || [];
  const experiencesPagination = usePagination(
    [],
    sharedExperiencesTotal,
    experiencesItemsPerPage
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-sora">Shared activities</h1>
        <p className="text-muted-foreground">
          View all shared activities and make changes here.
        </p>
      </div>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="inline-flex h-auto min-h-[2.5rem] items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full">
          {[
            {
              value: "pages",
              label: `Shared pages (${sharedPagesTotal || 0})`,
            },
            {
              value: "experiences",
              label: `Shared experiences (${allSharedExperiences.length})`,
            },
            {
              value: "likes",
              label: isLoadingLikes ? "Likes..." : `Likes (${allLikes.length})`,
            },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pages" className="mt-6 rounded-md border p-6">
          {isLoadingSharedPages ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedPagesError ? (
            <div className="text-center text-red-600 py-6">
              Failed to load shared pages:{" "}
              {sharedPagesError instanceof Error
                ? sharedPagesError.message
                : "Unknown error"}
            </div>
          ) : allSharedPages.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
                {allSharedPages?.map((page) => (
                  <SharedPageCard key={page.id} page={page} />
                ))}
              </div>
              <PaginationControls
                currentPage={pagesPagination.currentPage}
                totalPages={pagesPagination.totalPages}
                nextPage={pagesPagination.nextPage}
                prevPage={pagesPagination.prevPage}
                setCurrentPage={pagesPagination.setCurrentPage}
                itemName="page"
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-6">
              No pages shared yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="experiences" className="mt-6 rounded-md border p-6">
          {isLoadingSharedExperiences ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedExperiencesError ? (
            <div className="text-center text-red-600 py-6">
              Failed to load shared experiences:{" "}
              {sharedExperiencesError instanceof Error
                ? sharedExperiencesError.message
                : "Unknown error"}
            </div>
          ) : allSharedExperiences.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
                {allSharedExperiences.map((experience) => (
                  <SharedExperienceCard
                    key={experience.id}
                    experience={experience}
                  />
                ))}
              </div>
              <PaginationControls
                currentPage={experiencesPagination.currentPage}
                totalPages={experiencesPagination.totalPages}
                nextPage={experiencesPagination.nextPage}
                prevPage={experiencesPagination.prevPage}
                setCurrentPage={experiencesPagination.setCurrentPage}
                itemName="experience"
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-6">
              No experiences shared yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-6 rounded-md border p-6">
          {isLoadingLikes ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : likesError ? (
            <div className="text-center text-red-600 py-6">
              Failed to load likes:{" "}
              {likesError instanceof Error
                ? likesError.message
                : "Unknown error"}
            </div>
          ) : allLikes.length > 0 ? (
            <>
              <LikesCountView
                likes={allLikes}
                totalLikesCount={likesTotal}
                pagination={likesPagination}
              />
              <PaginationControls
                currentPage={likesPagination.currentPage}
                totalPages={likesPagination.totalPages}
                nextPage={likesPagination.nextPage}
                prevPage={likesPagination.prevPage}
                setCurrentPage={likesPagination.setCurrentPage}
                itemName="like"
              />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-6">
              No likes yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
