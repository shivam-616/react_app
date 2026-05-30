import { apiFetch, getUserId } from "./apiClient";

export interface UserProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: number | null;
  profile_pc?: string;
}

export const updateUserProfile = async (profileData: UserProfileData): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) {
    return false;
  }

  // Build payload matching your Java userinfoDto exactly
  const payload = {
    user_id: userId,
    first_name: profileData.first_name.trim(),
    last_name: profileData.last_name.trim(),
    email: profileData.email.trim(),
    phone_number: profileData.phone_number || null,
    profile_pc: profileData.profile_pc || null,
    // profile_pc can be left undefined if you aren't uploading images yet
  };

  const response = await apiFetch(
    "/user/v1/createUpdate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireUserId: true }, // Ensures X-User-Id is passed securely
  );

  return response.ok;
};