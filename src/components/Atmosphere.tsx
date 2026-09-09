/* Camadas fixas de atmosfera: glow radial, blobs, grid, scanlines e vinheta. */

export function Atmosphere() {
  return (
    <>
      {/* brilho radial do acento no topo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(252,211,77,0.16),transparent_70%)]"
      />
      {/* blobs de profundidade */}
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 top-1/4 z-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 bottom-1/4 z-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
      />
      {/* chão de grid arcade */}
      <div
        aria-hidden
        className="grid-floor pointer-events-none fixed inset-x-0 bottom-0 z-0 h-64"
      />
      {/* camada CRT */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <div className="scanlines absolute inset-0" />
        <div className="scanbeam" />
      </div>
      <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-40" />
    </>
  );
}
