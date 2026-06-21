import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const vert = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0, 1); }
    `
    const frag = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_res;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1,0)), f.x),
          mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.1;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        uv.y = 1.0 - uv.y;

        float t = u_time * 0.18;
        vec2 q = vec2(fbm(uv + t * 0.4), fbm(uv + 1.2));
        vec2 r = vec2(fbm(uv + 1.5 * q + vec2(1.7, 9.2) + t * 0.15),
                      fbm(uv + 1.5 * q + vec2(8.3, 2.8) + t * 0.12));
        float f = fbm(uv + 1.5 * r);

        vec3 warm1 = vec3(0.95, 0.35, 0.15);
        vec3 warm2 = vec3(0.95, 0.55, 0.05);
        vec3 cool  = vec3(0.08, 0.06, 0.18);
        vec3 mid   = vec3(0.45, 0.15, 0.55);

        vec3 color = mix(cool, mid, clamp(f * f * 4.0, 0.0, 1.0));
        color = mix(color, warm1, clamp(f * f * f * 10.0, 0.0, 1.0));
        color = mix(color, warm2, clamp(length(r - 0.5) * 1.2, 0.0, 1.0));

        // Glow particles
        float glow = 0.0;
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          vec2 center = vec2(
            0.2 + 0.6 * hash(vec2(fi, 1.0)),
            0.2 + 0.6 * hash(vec2(fi, 2.0))
          );
          center += 0.05 * vec2(
            sin(t * 0.7 + fi * 1.3),
            cos(t * 0.5 + fi * 2.1)
          );
          float d = length(uv - center);
          glow += 0.004 / (d * d + 0.002);
        }
        color += vec3(glow * 0.6, glow * 0.3, glow * 0.1);

        // Dark vignette
        float vig = 1.0 - smoothstep(0.4, 1.2, length(uv - 0.5) * 1.8);
        color *= vig * 0.85;

        gl_FragColor = vec4(color, 1.0);
      }
    `

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, src)
      gl!.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes  = gl.getUniformLocation(prog, 'u_res')

    let start = performance.now()
    let raf: number
    const draw = () => {
      const t = (performance.now() - start) / 1000
      gl!.uniform1f(uTime, t)
      gl!.uniform2f(uRes, canvas!.width, canvas!.height)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.auth.register(form.name, form.email, form.password)
      }
      const { token } = await api.auth.login(form.email, form.password)
      localStorage.setItem('token', token)
      window.dispatchEvent(new Event('auth-change'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-2"
              style={{ textShadow: '0 0 40px rgba(240,100,30,0.6)' }}>
            DevBoard
          </h1>
          <p className="text-slate-300 text-sm">Your personal dev workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
             style={{ background: 'rgba(15,10,30,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2 text-sm font-medium capitalize transition-all duration-200"
                style={{
                  background: mode === m ? 'rgba(240,100,30,0.8)' : 'transparent',
                  color: mode === m ? '#fff' : '#94a3b8',
                }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            {error && (
              <p className="text-red-400 text-xs text-center animate-pulse">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f06420, #e8a020)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
