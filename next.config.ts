import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dockerfile'ın çalışması için en kritik satır:
  output: "standalone", 

  // Ekranda gördüğünüz resim ayarını da ekliyorum (Google profil fotoğrafları vb. kullanacaksanız ileride hata vermesin)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;