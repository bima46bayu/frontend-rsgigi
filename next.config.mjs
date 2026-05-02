import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    // Memaksa Workbox untuk menyimpan semua HTML navigasi (Dinamis sekalipun)
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) => {
          // Tangkap request dokumen HTML penuh (F5) atau request RSC Next.js (navigasi klik)
          return request.mode === "navigate" || url.searchParams.has("_rsc");
        },
        handler: "NetworkFirst", // Coba minta server dulu. Kalau offline/gagal, keluarkan simpanan dari cache!
        options: {
          cacheName: "app-shell-pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // Simpan halaman selama 1 hari
          },
        },
      },
      // Meng-cache API GET bawaan untuk Data Tabel (Lintas Port localhost:8000)
      {
        urlPattern: /\/backend-api\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "api-data-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200], // 0 penting untuk request beda port (Cross-Origin)
          },
        },
      }
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Tetap mulus dengan turbopack saat npm run dev di lokal
  trailingSlash: true,
  turbopack: {},
};

export default withPWA(nextConfig);
