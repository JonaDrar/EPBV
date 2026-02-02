/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ebv/db", "@ebv/auth", "@ebv/mail"],
};

module.exports = nextConfig;
