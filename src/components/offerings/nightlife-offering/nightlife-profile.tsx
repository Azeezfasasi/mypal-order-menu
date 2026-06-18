"use client";

import { useState, useEffect } from "react";
import type { IUpdateProfileDto, INightlifeProfile } from "@/types/nightlife-types";
import { NightlifeApi } from "@/services/api/nightlife-service";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";

export default function NightlifeProfile() {
  const { data: profileData, isLoading, error } = NightlifeApi.useGetProfile();
  const updateProfile = NightlifeApi.useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<IUpdateProfileDto>({
    businessName: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
  });

  const profile = profileData?.data as INightlifeProfile | undefined;

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || "",
        description: profile.description || "",
        contactEmail: profile.contactEmail || "",
        contactPhone: profile.contactPhone || "",
        website: profile.website || "",
        location: {
          address: profile.location?.address || "",
          city: profile.location?.city || "",
          state: profile.location?.state || "",
          country: profile.location?.country || "",
        },
        socialMedia: {
          facebook: profile.socialMedia?.facebook || "",
          instagram: profile.socialMedia?.instagram || "",
          twitter: profile.socialMedia?.twitter || "",
        },
      });
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const fieldName = name.replace("location.", "");
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location!,
          [fieldName]: value,
        },
      }));
    } else if (name.startsWith("social.")) {
      const fieldName = name.replace("social.", "");
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia!,
          [fieldName]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.contactEmail || !formData.contactPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateProfile.mutateAsync(formData);
      setIsEditing(false);
    } catch (err) {
        console.error(err);
      // Error is handled by mutation's onError
    }
  };

  if (error) {
    return <ErrorHandler message="Error loading profile" />;
  }

  if (isLoading) {
    return <Loader message="Loading profile" />;
  }

  if (!profile) {
    return (
      <Card className="p-5">
        <div className="text-center py-8 text-gray-500">
          <p>No profile data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Profile</h2>
          <p className="text-gray-600">Manage your nightlife business information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Verification Status */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${profile.verified ? "bg-green-500" : "bg-yellow-500"}`}></span>
          <div>
            <p className="font-semibold">
              {profile.verified ? "Verified Business" : "Verification Pending"}
            </p>
            <p className="text-sm text-gray-600">
              {profile.verified
                ? "Your business is verified and visible to customers"
                : "Your business is under review"}
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Form/Display */}
      {isEditing ? (
        <Card className="p-5">
          <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Information */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">Business Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your business"
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">Location</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location?.address || ""}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location?.city || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location?.state || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    name="location.country"
                    value={formData.location?.country || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="pb-4">
              <h4 className="font-semibold mb-3">Social Media</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook</label>
                  <input
                    type="url"
                    name="social.facebook"
                    value={formData.socialMedia?.facebook || ""}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/..."
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram</label>
                  <input
                    type="url"
                    name="social.instagram"
                    value={formData.socialMedia?.instagram || ""}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/..."
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Twitter</label>
                  <input
                    type="url"
                    name="social.twitter"
                    value={formData.socialMedia?.twitter || ""}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/..."
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="font-semibold text-lg mb-2">{profile.businessName}</h3>
              <p className="text-gray-600">{profile.description}</p>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline mt-1 inline-block">
                  {profile.website}
                </a>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{profile.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{profile.contactPhone}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="font-semibold mb-2">Location</h4>
              <p className="text-gray-600">
                {profile.location.address && (
                  <>
                    {profile.location.address}, {profile.location.city}, {profile.location.state},{" "}
                    {profile.location.country}
                  </>
                )}
              </p>
            </div>

            {/* Social Media */}
            {(profile.socialMedia?.facebook ||
              profile.socialMedia?.instagram ||
              profile.socialMedia?.twitter) && (
              <div>
                <h4 className="font-semibold mb-2">Social Media</h4>
                <div className="flex gap-4">
                  {profile.socialMedia?.facebook && (
                    <a
                      href={profile.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                  {profile.socialMedia?.instagram && (
                    <a
                      href={profile.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {profile.socialMedia?.twitter && (
                    <a
                      href={profile.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
