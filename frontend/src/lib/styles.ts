// Class bersama agar semua input/tombol di kedua halaman terlihat identik (gaya neo-brutalist)
export const inputClass =
  'w-full bg-white border-2 border-ink px-3 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:shadow-hard-sm focus:-translate-x-px focus:-translate-y-px transition-all'
// Tombol: bayangan keras yang "terangkat" saat hover dan "tertekan" saat diklik
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-ink font-label-md text-label-md font-bold tracking-wide shadow-hard-sm transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 disabled:pointer-events-none'
export const btnPrimary = `${btn} bg-primary text-on-primary hover:bg-primary-fixed`
export const btnSecondary = `${btn} bg-white text-on-surface hover:bg-accent`
// Tab filter (Semua / Gaji / ...): pill() tidak aktif, pillActive() aktif
export const pill =
  'px-3 py-1 border-2 border-ink bg-white text-on-surface font-label-sm text-label-sm font-bold tracking-wide whitespace-nowrap transition-all hover:bg-accent hover:-translate-y-0.5'
export const pillActive = 'bg-ink text-accent shadow-hard-sm hover:bg-ink'
