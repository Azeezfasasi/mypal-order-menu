export interface CreateAvatarUrlArgs {
  /** Can be the user's name or the imgSrc. */
  avatarUrl: string;
  /** @see https://ui-avatars.com/ for additional properties. */
  additionalParams?: Record<string, string | number>;
}

export const createAvatarUrl = (args: CreateAvatarUrlArgs) => {
  const { avatarUrl: url, additionalParams } = args;

  if (url?.includes("http")) return url;

  const params = new URLSearchParams();
  params.append("name", url);
  params.append("size", "512");

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }

  return `https://ui-avatars.com/api.jpg?${params.toString()}`;
};
