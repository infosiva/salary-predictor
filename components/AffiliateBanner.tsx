export default function AffiliateBanner() {
  return (
    <div className="my-6 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-900/20 to-purple-900/20 p-4 text-center text-sm">
      <p className="mb-2 font-semibold text-violet-300">
        Host your own AI app for just $2.99/mo
      </p>
      <a
        href="https://hostinger.com?REFERRALCODE=SIVAPRAKASAM"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-colors"
      >
        Get Hostinger →
      </a>
      <p className="mt-1 text-xs text-gray-500">Sponsored · We earn a commission</p>
    </div>
  );
}
