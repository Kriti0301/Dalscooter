/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  safelist: [
    "w-4", "h-4", "ring-2", "ring-white", "rounded-full", "cursor-pointer",
    "bg-red-500", "bg-yellow-400", "bg-gray-400"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

