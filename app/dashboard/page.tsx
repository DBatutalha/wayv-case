"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface Campaign {
  id: number;
  title: string;
  description?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  assignedInfluencers?: Influencer[];
}

interface Influencer {
  id: number;
  name: string;
  followerCount: number;
  engagementRate: string;
}

// Zod validation schema
const campaignSchema = z.object({
  title: z.string().min(1, "Campaign title is required"),
  description: z.string().optional(),
  budget: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInfluencerForm, setShowInfluencerForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(
    null
  );
  const [showEditInfluencerForm, setShowEditInfluencerForm] = useState(false);

  // React Hook Form - Create Campaign
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  // React Hook Form - Edit Campaign
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
    reset: resetEdit,
    setValue: setValueEdit,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      startDate: "",
      endDate: "",
    },
  });

  // Debug: Form values değişikliklerini izle
  const formValues = watch();
  useEffect(() => {
    console.log("Form values changed:", formValues);
  }, [formValues]);

  const [influencerForm, setInfluencerForm] = useState({
    name: "",
    followerCount: 0,
    engagementRate: 0,
  });

  // Influencer Edit Form State
  const [influencerEditForm, setInfluencerEditForm] = useState({
    name: "",
    followerCount: 0,
    engagementRate: 0,
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch("/api/trpc/campaigns.list", {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      const data = await response.json();
      if (data.result?.data) {
        const campaignsData = data.result.data;

        // Local fetchCampaignInfluencers function
        const getCampaignInfluencers = async (
          campaignId: number
        ): Promise<Influencer[]> => {
          try {
            const response = await fetch(
              `/api/trpc/influencers.byCampaign?input=${encodeURIComponent(
                JSON.stringify({ campaignId })
              )}`,
              {
                method: "GET",
                headers: {
                  ...(accessToken && {
                    Authorization: `Bearer ${accessToken}`,
                  }),
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const campaignInfluencerIds = data.result?.data || [];
              const assignedInfluencers = influencers.filter((inf) =>
                campaignInfluencerIds.some(
                  (ci: { influencerId: number }) => ci.influencerId === inf.id
                )
              );
              return assignedInfluencers;
            } else {
              return [];
            }
          } catch (error) {
            console.error("Error fetching campaign influencers:", error);
            return [];
          }
        };

        // Her campaign için assigned influencers'ı fetch et
        const campaignsWithInfluencers = await Promise.all(
          campaignsData.map(async (campaign: Campaign) => {
            const assignedInfluencers = await getCampaignInfluencers(
              campaign.id
            );
            return {
              ...campaign,
              assignedInfluencers,
            };
          })
        );

        setCampaigns(campaignsWithInfluencers);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  }, [influencers]);

  const fetchInfluencers = useCallback(async () => {
    try {
      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch("/api/trpc/influencers.list", {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      const data = await response.json();
      if (data.result?.data) {
        setInfluencers(data.result.data);
      }
    } catch (error) {
      console.error("Error fetching influencers:", error);
    }
  }, []);

  // useEffect'i tüm callback fonksiyonlarından sonra tanımlıyoruz
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        window.location.href = "/login";
      } else {
        console.log("=== CLIENT SIDE USER ===");
        console.log("User data:", data.user);
        console.log("User ID:", data.user.id);

        // Supabase session bilgilerini kontrol et
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Session data:", sessionData);
        console.log(
          "Access token:",
          sessionData.session?.access_token?.substring(0, 20) + "..."
        );
        console.log(
          "Refresh token:",
          sessionData.session?.refresh_token?.substring(0, 20) + "..."
        );

        setUser(data.user);
        fetchCampaigns();
        fetchInfluencers();
      }
    };

    getUser();
  }, [fetchCampaigns, fetchInfluencers]);

  const createCampaign = async (data: CampaignFormData) => {
    try {
      console.log("=== FORM SUBMIT START ===");
      console.log("Form data:", data);
      console.log("Data title type:", typeof data.title);
      console.log("Data title value:", data.title);
      console.log("Data title length:", data.title?.length);

      console.log("Creating campaign with data:", data);
      console.log("Current user:", user);

      if (!user) {
        toast.error("No user found. Please log in again.");
        return;
      }

      // Clean the data before sending
      const cleanData = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        budget: data.budget?.trim() || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
      };

      console.log("Clean data object:", cleanData);
      console.log("Clean data JSON:", JSON.stringify(cleanData));

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log("Session access token exists:", !!accessToken);

      const response = await fetch("/api/trpc/campaigns.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: cleanData }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Campaign created successfully:", result);

        // Form'u reset et
        reset();
        setShowCreateForm(false);
        fetchCampaigns();
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);

        if (errorData.error?.message) {
          toast.error(`Campaign creation failed: ${errorData.error.message}`);
        } else if (errorData.error) {
          toast.error(
            `Campaign creation failed: ${JSON.stringify(errorData.error)}`
          );
        } else {
          toast.error(
            `Campaign creation failed: ${response.status} ${response.statusText}`
          );
        }
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(`Campaign creation failed: ${error}`);
    }
  };

  const createInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("=== INFLUENCER FORM SUBMIT ===");
      console.log("Influencer form data:", influencerForm);

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log("Influencer session access token exists:", !!accessToken);

      const response = await fetch("/api/trpc/influencers.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: influencerForm }),
      });

      console.log("Influencer response status:", response.status);
      console.log("Influencer response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Influencer created successfully:", result);

        setInfluencerForm({ name: "", followerCount: 0, engagementRate: 0 });
        setShowInfluencerForm(false);
        fetchInfluencers();
      } else {
        const errorData = await response.json();
        console.error("Influencer error response:", errorData);
        toast.error(
          `Influencer creation failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error creating influencer:", error);
      toast.error(`Influencer creation failed: ${error}`);
    }
  };

  const assignInfluencer = async (influencerId: number, campaignId: number) => {
    try {
      console.log("=== ASSIGN INFLUENCER SUBMIT ===");
      console.log("Assign data:", { influencerId, campaignId });

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log("Assign session access token exists:", !!accessToken);

      const response = await fetch("/api/trpc/influencers.assignToCampaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: { influencerId, campaignId } }),
      });

      console.log("Assign response status:", response.status);
      console.log("Assign response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Influencer assigned successfully:", result);
        toast.success("Influencer assigned successfully!");

        // Modal'ı kapat
        setSelectedCampaign(null);

        // Campaign'leri yeniden fetch et (assigned influencers ile birlikte)
        fetchCampaigns();
      } else {
        const errorData = await response.json();
        console.error("Assign error response:", errorData);
        toast.error(
          `Influencer assignment failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error assigning influencer:", error);
      toast.error(`Influencer assignment failed: ${error}`);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    console.log("=== EDIT CAMPAIGN START ===");
    console.log("Editing campaign:", campaign);

    setEditingCampaign(campaign);

    // Form'u campaign data ile doldur
    setValueEdit("title", campaign.title);
    setValueEdit("description", campaign.description || "");
    setValueEdit("budget", campaign.budget || "");
    setValueEdit("startDate", campaign.startDate || "");
    setValueEdit("endDate", campaign.endDate || "");

    setShowEditForm(true);
  };

  const updateCampaign = async (data: CampaignFormData) => {
    if (!editingCampaign) return;

    try {
      console.log("=== UPDATE CAMPAIGN START ===");
      console.log("Update data:", data);
      console.log("Editing campaign ID:", editingCampaign.id);

      if (!user) {
        toast.error("No user found. Please log in again.");
        return;
      }

      // Clean the data before sending
      const cleanData = {
        id: editingCampaign.id,
        title: data.title.trim(),
        description: data.description?.trim() || "",
        budget: data.budget?.trim() || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
      };

      console.log("Clean update data:", cleanData);

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log("Update session access token exists:", !!accessToken);

      const response = await fetch("/api/trpc/campaigns.update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: cleanData }),
      });

      console.log("Update response status:", response.status);
      console.log("Update response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Campaign updated successfully:", result);
        toast.success("Campaign updated successfully!");

        // Form'u reset et ve modal'ı kapat
        resetEdit();
        setShowEditForm(false);
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        const errorData = await response.json();
        console.error("Update error response:", errorData);
        toast.error(
          `Campaign update failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error(`Campaign update failed: ${error}`);
    }
  };

  const handleDeleteCampaign = async (
    campaignId: number,
    campaignTitle: string
  ) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete the campaign "${campaignTitle}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      console.log("=== DELETE CAMPAIGN START ===");
      console.log("Deleting campaign ID:", campaignId);

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch("/api/trpc/campaigns.delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: { id: campaignId } }),
      });

      console.log("Delete response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Campaign deleted successfully:", result);
        toast.success("Campaign deleted successfully!");

        // Campaign'leri yeniden fetch et
        fetchCampaigns();
      } else {
        const errorData = await response.json();
        console.error("Delete error response:", errorData);
        toast.error(
          `Campaign deletion failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error(`Campaign deletion failed: ${error}`);
    }
  };

  const handleEditInfluencer = (influencer: Influencer) => {
    console.log("=== EDIT INFLUENCER START ===");
    console.log("Editing influencer:", influencer);

    setEditingInfluencer(influencer);

    // Form'u influencer data ile doldur
    setInfluencerEditForm({
      name: influencer.name,
      followerCount: influencer.followerCount,
      engagementRate: parseFloat(influencer.engagementRate),
    });

    setShowEditInfluencerForm(true);
  };

  const updateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfluencer) return;

    try {
      console.log("=== UPDATE INFLUENCER START ===");
      console.log("Update data:", influencerEditForm);
      console.log("Editing influencer ID:", editingInfluencer.id);

      if (!user) {
        toast.error("No user found. Please log in again.");
        return;
      }

      // Clean the data before sending
      const cleanData = {
        id: editingInfluencer.id,
        name: influencerEditForm.name.trim(),
        followerCount: influencerEditForm.followerCount,
        engagementRate: influencerEditForm.engagementRate,
      };

      console.log("Clean update data:", cleanData);

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log(
        "Update influencer session access token exists:",
        !!accessToken
      );

      const response = await fetch("/api/trpc/influencers.update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: cleanData }),
      });

      console.log("Update influencer response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Influencer updated successfully:", result);
        toast.success("Influencer updated successfully!");

        // Form'u reset et ve modal'ı kapat
        setInfluencerEditForm({
          name: "",
          followerCount: 0,
          engagementRate: 0,
        });
        setShowEditInfluencerForm(false);
        setEditingInfluencer(null);
        fetchInfluencers();
        fetchCampaigns(); // Campaign'lerdeki assigned influencer bilgilerini güncelle
      } else {
        const errorData = await response.json();
        console.error("Update influencer error response:", errorData);
        toast.error(
          `Influencer update failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating influencer:", error);
      toast.error(`Influencer update failed: ${error}`);
    }
  };

  const handleDeleteInfluencer = async (
    influencerId: number,
    influencerName: string
  ) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete the influencer "${influencerName}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      console.log("=== DELETE INFLUENCER START ===");
      console.log("Deleting influencer ID:", influencerId);

      // Supabase session'dan token al
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch("/api/trpc/influencers.delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({ input: { id: influencerId } }),
      });

      console.log("Delete influencer response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Influencer deleted successfully:", result);
        toast.success("Influencer deleted successfully!");

        // Influencer'ları yeniden fetch et
        fetchInfluencers();
        fetchCampaigns(); // Campaign'lerdeki assigned influencer bilgilerini güncelle
      } else {
        const errorData = await response.json();
        console.error("Delete influencer error response:", errorData);
        toast.error(
          `Influencer deletion failed: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error deleting influencer:", error);
      toast.error(`Influencer deletion failed: ${error}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className=" bg-gray-100 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Campaign Management
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaigns Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Campaigns</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>{showCreateForm ? "Cancel" : "Create Campaign"}</span>
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Campaign
              </h3>
              <form
                onSubmit={handleSubmit(createCampaign)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Campaign Title"
                      {...register("title")}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget
                    </label>
                    <input
                      type="text"
                      placeholder="Budget"
                      {...register("budget")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register("startDate")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      {...register("endDate")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Campaign Description"
                    {...register("description")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Campaign"}
                </button>
              </form>
            </div>
          )}

          {/* Edit Campaign Form */}
          {showEditForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Campaign: &ldquo;{editingCampaign?.title}&rdquo;
              </h3>
              <form
                onSubmit={handleSubmitEdit(updateCampaign)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Campaign Title"
                      {...registerEdit("title")}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 ${
                        errorsEdit.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errorsEdit.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errorsEdit.title.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget
                    </label>
                    <input
                      type="text"
                      placeholder="Budget"
                      {...registerEdit("budget")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...registerEdit("startDate")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      {...registerEdit("endDate")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Campaign Description"
                    {...registerEdit("description")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEdit ? "Updating..." : "Update Campaign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingCampaign(null);
                      resetEdit();
                    }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="font-semibold text-xl text-gray-900 mb-3">
                  {campaign.title}
                </h3>
                {campaign.description && (
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  {campaign.budget && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Budget:</span>{" "}
                      {campaign.budget}
                    </p>
                  )}
                  {campaign.startDate && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Start:</span>{" "}
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </p>
                  )}
                  {campaign.endDate && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">End:</span>{" "}
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  )}

                  {/* Assigned Influencers */}
                  {campaign.assignedInfluencers &&
                    campaign.assignedInfluencers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Assigned Influencers (
                          {campaign.assignedInfluencers.length})
                        </p>
                        <div className="space-y-1">
                          {campaign.assignedInfluencers
                            .slice(0, 3)
                            .map((influencer) => (
                              <div
                                key={influencer.id}
                                className="flex items-center justify-between text-xs text-gray-600"
                              >
                                <span className="font-medium">
                                  {influencer.name}
                                </span>
                                <span>
                                  {influencer.followerCount.toLocaleString()}{" "}
                                  followers
                                </span>
                              </div>
                            ))}
                          {campaign.assignedInfluencers.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{campaign.assignedInfluencers.length - 3} more...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                  >
                    Assign Influencers
                  </button>
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    title="Edit Campaign"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteCampaign(campaign.id, campaign.title)
                    }
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    title="Delete Campaign"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Influencers Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Influencers</h2>
            <button
              onClick={() => setShowInfluencerForm(!showInfluencerForm)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>{showInfluencerForm ? "Cancel" : "Add Influencer"}</span>
            </button>
          </div>

          {showInfluencerForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Influencer
              </h3>
              <form onSubmit={createInfluencer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Influencer Name"
                      value={influencerForm.name}
                      onChange={(e) =>
                        setInfluencerForm({
                          ...influencerForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follower Count
                    </label>
                    <input
                      type="number"
                      placeholder="Follower Count"
                      value={influencerForm.followerCount}
                      onChange={(e) =>
                        setInfluencerForm({
                          ...influencerForm,
                          followerCount: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engagement Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="Engagement Rate"
                      value={influencerForm.engagementRate}
                      onChange={(e) =>
                        setInfluencerForm({
                          ...influencerForm,
                          engagementRate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Add Influencer
                </button>
              </form>
            </div>
          )}

          {/* Edit Influencer Form */}
          {showEditInfluencerForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Influencer: &ldquo;{editingInfluencer?.name}&rdquo;
              </h3>
              <form onSubmit={updateInfluencer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Influencer Name"
                      value={influencerEditForm.name}
                      onChange={(e) =>
                        setInfluencerEditForm({
                          ...influencerEditForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follower Count
                    </label>
                    <input
                      type="number"
                      placeholder="Follower Count"
                      value={influencerEditForm.followerCount}
                      onChange={(e) =>
                        setInfluencerEditForm({
                          ...influencerEditForm,
                          followerCount: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engagement Rate (%)
                    </label>
                    <input
                      type="number"
                      placeholder="Engagement Rate"
                      value={influencerEditForm.engagementRate}
                      onChange={(e) =>
                        setInfluencerEditForm({
                          ...influencerEditForm,
                          engagementRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Update Influencer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditInfluencerForm(false);
                      setEditingInfluencer(null);
                      setInfluencerEditForm({
                        name: "",
                        followerCount: 0,
                        engagementRate: 0,
                      });
                    }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  {influencer.name}
                </h3>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">
                      {influencer.followerCount.toLocaleString()}
                    </span>{" "}
                    followers
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">
                      {influencer.engagementRate}%
                    </span>{" "}
                    engagement
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditInfluencer(influencer)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    title="Edit Influencer"
                  >
                    <svg
                      className="w-4 h-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteInfluencer(influencer.id, influencer.name)
                    }
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    title="Delete Influencer"
                  >
                    <svg
                      className="w-4 h-4 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Influencer Assignment Modal */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Influencers to &ldquo;{selectedCampaign.title}&rdquo;
              </h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Already Assigned Influencers */}
            {selectedCampaign.assignedInfluencers &&
              selectedCampaign.assignedInfluencers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Already Assigned (
                    {selectedCampaign.assignedInfluencers.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedCampaign.assignedInfluencers.map((influencer) => (
                      <div
                        key={influencer.id}
                        className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-green-800 text-sm">
                            {influencer.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {influencer.followerCount.toLocaleString()}{" "}
                            followers
                          </p>
                        </div>
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                          ✓ Assigned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Available Influencers
              </h4>
              {influencers
                .filter(
                  (inf) =>
                    !selectedCampaign.assignedInfluencers?.some(
                      (assigned) => assigned.id === inf.id
                    )
                )
                .map((influencer) => (
                  <div
                    key={influencer.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {influencer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {influencer.followerCount.toLocaleString()} followers
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        assignInfluencer(influencer.id, selectedCampaign.id)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Assign
                    </button>
                  </div>
                ))}

              {/* Eğer tüm influencer'lar atanmışsa */}
              {influencers.length > 0 &&
                influencers.every((inf) =>
                  selectedCampaign.assignedInfluencers?.some(
                    (assigned) => assigned.id === inf.id
                  )
                ) && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      All influencers are already assigned to this campaign
                    </p>
                  </div>
                )}
            </div>
            <button
              onClick={() => setSelectedCampaign(null)}
              className="mt-6 w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </div>
  );
}
