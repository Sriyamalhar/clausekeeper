import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://clausekeeper.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/contracts/", "/clients/", "/settings/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
