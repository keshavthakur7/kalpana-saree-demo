export const PROFILE_KEY = "kalpana-saree-profile";

export const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: ""
};

export function readProfile() {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    return value && typeof value === "object"
      ? { ...emptyProfile, ...value }
      : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

export function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
