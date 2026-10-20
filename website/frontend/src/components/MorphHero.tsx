import { useEffect, useRef } from 'react'

function stepResponse(t: number, t0: number, omega = 15) {
  if (t < t0) return 0
  const dt = t - t0
  return 1 - Math.exp(-omega * dt) * (1 + omega * dt)
}

function evaluateTimeline(t: number, initial: number, changes: any[], omega = 15) {
  let value = initial
  for (let i = 0; i < changes.length; i++) {
    const prevTarget = i === 0 ? initial : changes[i - 1].val
    const step = changes[i].val - prevTarget
    value += step * stepResponse(t, changes[i].t, changes[i].omega || omega)
  }
  return value
}

const BEAT = 0.5
const LOOP_DURATION = 14.0

const COLOR_TEAL = [15, 118, 110]
const COLOR_WHITE = [255, 255, 255]
const COLOR_BLACK = [15, 23, 42]

const shapeWidth = [{ t: 3 * BEAT, val: 400 }, { t: 8 * BEAT, val: 100 }, { t: 12 * BEAT, val: 600 }, { t: 22 * BEAT, val: 300 }, { t: 26 * BEAT, val: 200 }]
const shapeHeight = [{ t: 3 * BEAT, val: 300 }, { t: 8 * BEAT, val: 100 }, { t: 12 * BEAT, val: 400 }, { t: 22 * BEAT, val: 60 }, { t: 26 * BEAT, val: 60 }]
const shapeRadius = [{ t: 3 * BEAT, val: 20 }, { t: 8 * BEAT, val: 50 }, { t: 12 * BEAT, val: 20 }, { t: 22 * BEAT, val: 12 }, { t: 26 * BEAT, val: 30 }]

const shapeR = [{ t: 3 * BEAT, val: COLOR_WHITE[0] }, { t: 8 * BEAT, val: COLOR_TEAL[0] }, { t: 12 * BEAT, val: COLOR_WHITE[0] }, { t: 22 * BEAT, val: COLOR_BLACK[0] }, { t: 26 * BEAT, val: COLOR_TEAL[0] }]
const shapeG = [{ t: 3 * BEAT, val: COLOR_WHITE[1] }, { t: 8 * BEAT, val: COLOR_TEAL[1] }, { t: 12 * BEAT, val: COLOR_WHITE[1] }, { t: 22 * BEAT, val: COLOR_BLACK[1] }, { t: 26 * BEAT, val: COLOR_TEAL[1] }]
const shapeB = [{ t: 3 * BEAT, val: COLOR_WHITE[2] }, { t: 8 * BEAT, val: COLOR_TEAL[2] }, { t: 12 * BEAT, val: COLOR_WHITE[2] }, { t: 22 * BEAT, val: COLOR_BLACK[2] }, { t: 26 * BEAT, val: COLOR_TEAL[2] }]

const layers = {
  button: [{ t: 3 * BEAT, val: 0 }, { t: 26 * BEAT, val: 1 }],
  dropzone: [{ t: 3 * BEAT, val: 1 }, { t: 8 * BEAT, val: 0 }],
  loader: [{ t: 8 * BEAT, val: 1 }, { t: 12 * BEAT, val: 0 }],
  chart: [{ t: 12 * BEAT, val: 1 }, { t: 22 * BEAT, val: 0 }],
  toast: [{ t: 22 * BEAT, val: 1 }, { t: 26 * BEAT, val: 0 }]
}

const cursorX = [{ t: 1 * BEAT, val: 720 }, { t: 4 * BEAT, val: 900 }, { t: 6 * BEAT, val: 720 }, { t: 10 * BEAT, val: 720 }, { t: 14 * BEAT, val: 450 }, { t: 17 * BEAT, val: 950 }, { t: 20 * BEAT, val: 720 }, { t: 27 * BEAT, val: 800 }, { t: 28 * BEAT, val: 800 }]
const cursorY = [{ t: 1 * BEAT, val: 740 }, { t: 4 * BEAT, val: 200 }, { t: 6 * BEAT, val: 720 }, { t: 10 * BEAT, val: 720 }, { t: 14 * BEAT, val: 720 }, { t: 17 * BEAT, val: 720 }, { t: 20 * BEAT, val: 740 }, { t: 27 * BEAT, val: 900 }, { t: 28 * BEAT, val: 900 }]
const cursorScale = [{ t: 2 * BEAT, val: 0.8, omega: 40 }, { t: 2.5 * BEAT, val: 1, omega: 40 }, { t: 5 * BEAT, val: 0.8, omega: 40 }, { t: 6.5 * BEAT, val: 1, omega: 40 }, { t: 14 * BEAT, val: 0.8, omega: 40 }, { t: 17 * BEAT, val: 1, omega: 40 }, { t: 21.5 * BEAT, val: 0.8, omega: 40 }, { t: 22 * BEAT, val: 1, omega: 40 }]

export default function MorphHero() {
  const shapeRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const contentRefs = {
    button: useRef<HTMLDivElement>(null),
    dropzone: useRef<HTMLDivElement>(null),
    loader: useRef<HTMLDivElement>(null),
    chart: useRef<HTMLDivElement>(null),
    toast: useRef<HTMLDivElement>(null)
  }

  useEffect(() => {
    let animationFrameId: number
    const startTime = performance.now() / 1000

    function tick() {
      const time = performance.now() / 1000 - startTime
      const t = time % LOOP_DURATION

      const w = evaluateTimeline(t, 200, shapeWidth)
      const h = evaluateTimeline(t, 60, shapeHeight)
      const r = evaluateTimeline(t, 30, shapeRadius)
      const cr = Math.round(evaluateTimeline(t, COLOR_TEAL[0], shapeR))
      const cg = Math.round(evaluateTimeline(t, COLOR_TEAL[1], shapeG))
      const cb = Math.round(evaluateTimeline(t, COLOR_TEAL[2], shapeB))

      if (shapeRef.current) {
        shapeRef.current.style.width = `${w}px`
        shapeRef.current.style.height = `${h}px`
        shapeRef.current.style.borderRadius = `${r}px`
        shapeRef.current.style.backgroundColor = `rgb(${cr}, ${cg}, ${cb})`

        if (cr > 200) {
          shapeRef.current.style.boxShadow = '0 0 0 1px #E2E8F0, 0 10px 15px -3px rgba(0,0,0,0.1)'
        } else {
          shapeRef.current.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
      }

      const cx = evaluateTimeline(t, 800, cursorX)
      const cy = evaluateTimeline(t, 900, cursorY)
      const cs = evaluateTimeline(t, 1, cursorScale)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(calc(-50% + ${cx - 720}px), calc(-50% + ${cy - 720}px)) scale(${cs})`
      }

      for (const [key, ref] of Object.entries(contentRefs)) {
        if (!ref.current) continue
        const initialOpacity = key === 'button' ? 1 : 0
        const opacity = evaluateTimeline(t, initialOpacity, layers[key as keyof typeof layers], 30)
        const blur = (1 - Math.max(0, Math.min(1, opacity))) * 10
        ref.current.style.opacity = opacity.toString()
        ref.current.style.filter = `blur(${blur}px)`
        ref.current.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto'
      }

      if (contentRefs.loader.current) {
        if (t > 8 * BEAT && t < 12 * BEAT) {
          const rot = (t * 360) % 360
          contentRefs.loader.current.style.transform = `rotate(${rot}deg)`
        } else {
          contentRefs.loader.current.style.transform = 'none'
        }
      }

      animationFrameId = requestAnimationFrame(tick)
    }

    tick()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-3xl bg-[#F7F5F3] shadow-inner">
      <div
        ref={shapeRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden shadow-md will-change-[width,height,border-radius,background-color]"
        style={{ backgroundColor: '#0F766E', borderRadius: 30, width: 200, height: 60 }}
      >
        <div ref={contentRefs.button} className="absolute inset-0 flex items-center justify-center text-xl font-medium text-white opacity-0 blur-md">
          Train Workspace
        </div>

        <div ref={contentRefs.dropzone} className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[inherit] border-4 border-dashed border-slate-300 text-slate-500 opacity-0 blur-md p-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span className="font-medium text-lg text-slate-700">Drop sales_history.csv</span>
        </div>

        <div ref={contentRefs.loader} className="absolute inset-0 m-auto h-12 w-12 rounded-full border-4 border-white/30 border-t-white opacity-0 blur-md" />

        <div ref={contentRefs.chart} className="absolute inset-0 flex flex-col items-start justify-start p-10 text-slate-900 opacity-0 blur-md box-border">
          <h3 className="m-0 font-serif text-3xl">Demand Forecast</h3>
          <div className="relative mt-6 h-full w-full border-b-2 border-l-2 border-slate-200" />
        </div>

        <div ref={contentRefs.toast} className="absolute inset-0 flex items-center justify-center text-xl font-medium text-white opacity-0 blur-md">
          Plan updated
        </div>
      </div>

      <div
        ref={cursorRef}
        className="pointer-events-none absolute left-1/2 top-1/2 z-50 h-8 w-8 will-change-transform"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="2"><polygon points="3 3 10 21 14 14 21 10 3 3"/></svg>')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  )
}
