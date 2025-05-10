"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Community } from "@/types/community";
import { getMediaUrl } from "@/services/api";

interface CommunityCardProps {
  community: Community;
  className?: string;
}

// Memoize the component to prevent unnecessary re-renders
const CommunityCard: React.FC<CommunityCardProps> = memo(({
  community,
  className = "",
}) => {
  // State to track image loading errors
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Bail out if community object is invalid
  if (
    !community ||
    typeof community !== "object" ||
    !community.id ||
    !community.slug
  ) {
    console.error("Invalid community object", community);
    return null;
  }

  const getCategoryColor = (category: string = "other") => {
    const colorMap: Record<string, string> = {
      academic: "bg-blue-100 text-blue-800",
      social: "bg-purple-100 text-purple-800",
      sports: "bg-green-100 text-green-800",
      arts: "bg-orange-100 text-orange-800",
      career: "bg-teal-100 text-teal-800",
      technology: "bg-indigo-100 text-indigo-800",
      health: "bg-red-100 text-red-800",
      service: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return colorMap[category] || "bg-gray-100 text-gray-800";
  };

  // Generate initials for communities without images
  const getInitials = () => {
    if (!community.name) return "C";

    return community.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Safe category display
  const category = community.category || "other";
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);

  // Safe member and post counts
  const memberCount = community.member_count || 0;
  const postCount = community.post_count || 0;

  // Precomputed values for performance
  const bannerUrl = community.banner ? getMediaUrl(community.banner) : "";
  const imageUrl = community.image ? getMediaUrl(community.image) : "";
  const communityLink = `/communities/${community.slug}`;

  return (
    <Link
      href={communityLink}
      className={`block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden community-card-container ${className}`}
    >
      {/* Community banner */}
      <div className="relative h-32 w-full bg-blue-50">
        {community.banner && !bannerError ? (
          <Image
            src={bannerUrl}
            alt={`${community.name || "Community"} banner`}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setBannerError(true)}
            unoptimized={true}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-100 to-blue-50"></div>
        )}
      </div>

      {/* Community avatar */}
      <div className="relative -mt-10 ml-5">
        {community.image && !avatarError ? (
          <div className="relative h-20 w-20 rounded-xl overflow-hidden border-4 border-white shadow-sm">
            <Image
              src={imageUrl}
              alt={community.name || "Community"}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-xl"
              sizes="80px"
              onError={() => setAvatarError(true)}
              unoptimized={true}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 w-20 rounded-xl bg-blue-500 text-white font-bold text-2xl border-4 border-white shadow-sm">
            {getInitials()}
          </div>
        )}
      </div>

      {/* Community details */}
      <div className="p-5 pt-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {community.name || "Untitled Community"}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
              category
            )}`}
          >
            {categoryDisplay}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {community.short_description ||
            community.description ||
            "No description available"}
        </p>

        <div className="mt-4 flex items-center text-sm text-gray-500">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </div>

          <div className="flex items-center ml-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            {postCount} {postCount === 1 ? "post" : "posts"}
          </div>

          {community.is_private && (
            <div className="ml-auto">
              <span className="inline-flex items-center text-xs text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Private
              </span>
            </div>
          )}
        </div>

        {/* Status indicator for members */}
        {(community.is_member ?? false) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
              ${
                community.membership_role === "admin"
                  ? "bg-blue-100 text-blue-700"
                  : community.membership_role === "moderator"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {community.membership_status === "pending"
                ? "Membership pending"
                : community.membership_role
                ? community.membership_role.charAt(0).toUpperCase() +
                  community.membership_role.slice(1)
                : "Member"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
});

// Add displayName for better debugging
CommunityCard.displayName = 'CommunityCard';

export default CommunityCard;
