const brands = ["Google", "Slack", "GitHub", "Notion", "Spotify", "Vercel"]

export function TrustBar() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-xs font-medium tracking-widest text-slate-400 uppercase">
          Trusted by product teams worldwide
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-lg font-semibold text-slate-300 select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
