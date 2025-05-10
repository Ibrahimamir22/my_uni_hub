"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { communityApi } from "@/services/api";
import { Community } from "@/types/community";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomSelect from "@/components/ui/CustomSelect";
import FileUpload from "@/components/ui/FileUpload";
import RichTextEditor from "@/components/ui/RichTextEditor";

// Custom hook for debouncing validation
function useDebounceValidation(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export default function CreatePostPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    content?: string;
    postType?: string;
  }>({});

  // Debounced values for validation
  const debouncedTitle = useDebounceValidation(title, 300);
  const debouncedPostType = useDebounceValidation(postType, 300);
  
  // Run validation on debounced values for better performance
  useEffect(() => {
    // Skip validation during initial load or when fields are empty
    if (!debouncedTitle && !debouncedPostType) return;
    
    const newErrors: {
      title?: string;
      postType?: string;
    } = {};
    
    if (debouncedTitle && debouncedTitle.length > 255) {
      newErrors.title = "Title must be less than 255 characters";
    }
    
    // Update only the validated fields
    setFormErrors(prev => ({
      ...prev,
      ...newErrors
    }));
  }, [debouncedTitle, debouncedPostType]);

  // Optimize form validation - don't validate on every keystroke
  const validateForm = useCallback(() => {
    const errors: {
      title?: string;
      content?: string;
      postType?: string;
    } = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    } else if (title.length > 255) {
      errors.title = "Title must be less than 255 characters";
    }
    
    // Check if content only contains empty paragraph tags or is empty
    const contentWithoutTags = content.replace(/<[^>]*>/g, '').trim();
    if (!contentWithoutTags) {
      errors.content = "Content is required";
    }
    
    if (!postType) {
      errors.postType = "Please select a post type";
    }
    
    return errors;
  }, [title, content, postType]);

  // Post types with icons
  const postTypes = [
    { value: "discussion", label: "Discussion", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ) },
    { value: "question", label: "Question", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) },
    { value: "event", label: "Event", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ) },
    { value: "announcement", label: "Announcement", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ) },
    { value: "resource", label: "Resource", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ) },
  ];

  // Visibility options
  const visibilityOptions = [
    { value: "public", label: "Public - Visible to everyone", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) },
    { value: "members", label: "Members Only - Visible only to community members", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ) },
    { value: "admin", label: "Admin Only - Visible only to community admins", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ) },
  ];

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add a small delay to allow auth state to restore on hard refresh
        if (!isAuthenticated) {
          console.log("Not authenticated yet, delaying authentication check...");
          // Wait a short time to see if auth state loads from storage
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if user is authenticated after potential delay
        if (!isAuthenticated) {
          console.log("Still not authenticated after delay, redirecting to login");
          const currentPath = `/communities/${slug}/posts/create`;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Fetch community details
        const communityData = await communityApi.getCommunity(slug as string);
        setCommunity(communityData);

        // Check if user is a member of the community or the creator
        const isMember = (communityData.is_member ?? false) || communityData.creator?.id === user?.id;
        
        if (!isMember) {
          setError(
            "You must be a member of this community to create posts. Please join the community first."
          );
        }
      } catch (err) {
        console.error("Failed to fetch community:", err);
        setError("Failed to load community. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCommunity();
    }
  }, [slug, isAuthenticated, router, user]);

  // Optimize file handling to improve performance
  const processImage = useCallback(async (file: File): Promise<File> => {
    // Skip processing if file is not an image or is small enough
    if (!file.type.startsWith('image/') || file.size <= 500 * 1024) {
      return file;
    }
    
    // For larger images, compress before uploading
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and export
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to Blob with reduced quality
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new file from the blob
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            // Fallback to original if compression fails
            resolve(file);
          }
        }, 'image/jpeg', 0.85); // 85% quality
      };
      
      // Load image from file
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Optimize file change handlers
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check if file size is within limits before setting
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image file size must be less than 5MB");
        return;
      }
      setImage(file);
    }
  }, []);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check if file size is within limits before setting
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Attachment file size must be less than 10MB");
        return;
      }
      setFile(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=/communities/${slug}/posts/create`);
      return;
    }
    
    // Validate required fields
    const errors = validateForm();
    
    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError("Please fill in all required fields");
      return;
    }
    
    // Reset any previous errors
    setFormErrors({});
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (!community) {
        throw new Error("Community data is missing");
      }
      
      // Debug values
      console.log("SUBMISSION VALUES:");
      console.log(`Title: "${title}"`);
      console.log(`Content: "${content}"`);
      console.log(`Post Type: "${postType}"`);
      console.log(`Tags: "${tags}"`);
      console.log(`Visibility: "${visibility}"`);
      
      // Create form data for submission with files
      const formData = new FormData();
      formData.append('title', title);
      
      // Process the content to ensure it's treated as HTML
      const processedContent = content.startsWith('<p>') ? content : `<p>${content}</p>`;
      formData.append('content', processedContent);
      
      formData.append('post_type', postType);
      formData.append('tags', tags);
      formData.append('visibility', visibility);
      
      // Add optional fields
      if (postType === 'event') {
        if (eventDate) formData.append('event_date', eventDate);
        if (eventLocation) formData.append('event_location', eventLocation);
      }
      
      // Process and add file attachments if present
      if (image) {
        // Process image to optimize it before uploading
        const optimizedImage = await processImage(image);
        formData.append('image', optimizedImage);
      }
      
      if (file) formData.append('file', file);
      
      // Show formdata contents for debugging
      console.log("FormData contents:");
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Get CSRF token if needed
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      // Get auth token from cookies
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
      
      console.log("Submitting post with token:", authToken ? `${authToken.substring(0, 10)}...` : "No token");
      
      // Use direct URL to backend WITH trailing slash
      const backendUrl = 'http://localhost:8000/api';
      const endpoint = `${backendUrl}/communities/${slug}/posts/`;
      console.log(`Posting to: ${endpoint}`);
      
      // Show optimistic feedback immediately (UI feels faster)
      // This avoids waiting for the server response to show success feedback
      // We'll handle errors if they occur
      setSubmitting(true);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken || '',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 400) {
          const validationErrors = await response.json();
          console.error("Validation errors:", validationErrors);
          
          // Format error messages
          const newFormErrors: { title?: string; content?: string; postType?: string } = {};
          
          if (validationErrors.title) {
            newFormErrors.title = Array.isArray(validationErrors.title) 
              ? validationErrors.title[0] 
              : validationErrors.title;
          }
          
          if (validationErrors.content) {
            newFormErrors.content = Array.isArray(validationErrors.content) 
              ? validationErrors.content[0] 
              : validationErrors.content;
          }
          
          if (validationErrors.post_type) {
            newFormErrors.postType = Array.isArray(validationErrors.post_type) 
              ? validationErrors.post_type[0] 
              : validationErrors.post_type;
            
            // Special debug info for post_type issues
            console.error("Post type error details:", validationErrors.post_type);
          }
          
          if (Object.keys(newFormErrors).length > 0) {
            setFormErrors(newFormErrors);
            setError("Please correct the errors in the form.");
            setSubmitting(false);
            return;
          }
        } else if (response.status === 403) {
          // Handle permission errors
          throw new Error("You don't have permission to create posts in this community.");
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      // Success case
      const result = await response.json();
      console.log("Post created successfully:", result);
      router.push(`/communities/${slug}?refresh=true`);
      
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    title, 
    content, 
    postType, 
    eventDate, 
    eventLocation, 
    image, 
    file, 
    community, 
    slug, 
    router, 
    isAuthenticated,
    processImage,
    validateForm,
    tags,
    visibility
  ]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded mb-6"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state - if community is not found or user can't access
  if (error && !community) {
    return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <Link
              href={`/communities/${slug}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!community) {
    return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">Community not found</p>
                </div>
              </div>
            </div>
            <Link
              href="/communities"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Communities
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li>
                  <Link
                    href="/communities"
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Communities
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="w-3 h-3 text-gray-400 mx-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 9 4-4-4-4"
                      />
                    </svg>
                    <Link
                      href={`/communities/${slug}`}
                      className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                    >
                      {community?.name}
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg
                      className="w-3 h-3 text-gray-400 mx-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 9 4-4-4-4"
                      />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      Create Post
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Create a new post in {community?.name}
            </h1>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="space-y-6">
                {/* Post Type Selection */}
                <div className="relative z-30">
                  <CustomSelect
                    id="postType"
                    name="postType"
                    label="Post Type"
                    value={postType}
                    onChange={(value) => {
                      console.log("Post type changed to:", value);
                      setPostType(value);
                    }}
                    required
                    options={postTypes}
                    placeholder="Select a post type"
                    error={formErrors.postType}
                  />
                </div>

                {/* Title Input */}
                <div className="relative z-20">
                  <Input
                    type="text"
                    name="title"
                    id="title"
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    error={formErrors.title}
                  />
                </div>

                {/* Content RichTextEditor */}
                <div className="relative z-10">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Content <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    error={formErrors.content}
                    placeholder="Write your post content here..."
                    minHeight="300px"
                    required
                  />
                </div>
                
                {/* Tags Input */}
                <div className="relative z-20">
                  <Input
                    type="text"
                    name="tags"
                    id="tags"
                    label="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. study group, exam, resources"
                  />
                  <p className="mt-1 text-xs text-gray-500">Add tags to help others find your post. Separate with commas.</p>
                </div>
                
                {/* Visibility Setting */}
                <div className="relative z-30">
                  <CustomSelect
                    id="visibility"
                    name="visibility"
                    label="Visibility"
                    value={visibility}
                    onChange={(value) => setVisibility(value)}
                    options={visibilityOptions}
                    placeholder="Select who can see this post"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Control who can see your post: everyone, community members only, or community admins only.
                  </p>
                </div>

                {/* Event Details (only shown for event post type) */}
                {postType === "event" && (
                  <div className="space-y-6 bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-900">
                      Event Details
                    </h3>

                    {/* Event Date */}
                    <div>
                      <Input
                        type="datetime-local"
                        name="event-date"
                        id="event-date"
                        label="Event Date and Time"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>

                    {/* Event Location */}
                    <div>
                      <Input
                        type="text"
                        name="event-location"
                        id="event-location"
                        label="Location"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="Where will the event take place?"
                      />
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div>
                  <FileUpload
                    id="image"
                    name="image"
                    label="Image (optional)"
                    accept="image/*"
                    onChange={handleImageChange}
                    acceptedFormats="JPEG, PNG, GIF"
                    maxSize="5MB"
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <FileUpload
                    id="file"
                    name="file"
                    label="Attachment (optional)"
                    onChange={handleFileChange}
                    acceptedFormats="PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX"
                    maxSize="10MB"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Link
                    href={`/communities/${slug}`}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <Button
                    type="submit"
                    disabled={!title || !content || submitting}
                    isLoading={submitting}
                  >
                    Create Post
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 