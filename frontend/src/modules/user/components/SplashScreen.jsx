import React, { useEffect, useRef } from 'react'

export default function SplashScreen({ onComplete }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    let animationFrameId
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      void main() {
        vec2 uv = v_texCoord;
        vec3 color1 = vec3(0.34, 0.0, 0.07); 
        vec3 color2 = vec3(0.46, 0.35, 0.1);
        float noise = sin(uv.x * 8.0 + u_time * 0.5) * cos(uv.y * 8.0 + u_time * 0.5) * 0.5 + 0.5;
        vec3 finalColor = mix(color1, color2, noise * 0.4);
        float shimmer = pow(max(0.0, sin(uv.x * 15.0 - u_time * 1.5) * cos(uv.y * 15.0 + u_time)), 8.0);
        finalColor += vec3(0.9, 0.75, 0.3) * shimmer * 0.25;
        gl_FragColor = vec4(finalColor, 0.95);
      }
    `

    function createShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uTime = gl.getUniformLocation(prog, 'u_time')

    function render(t) {
      if (canvas) {
        gl.viewport(0, 0, canvas.width, canvas.height)
        if (uTime) gl.uniform1f(uTime, t * 0.001)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      animationFrameId = requestAnimationFrame(render)
    }
    render(0)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full min-h-screen flex-grow overflow-hidden bg-[#570013] text-[#fbf9f5] flex flex-col items-center justify-center font-body">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" width={1280} height={720} />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-lg">
        <div className="animate-scale-fade flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 border border-[#ffdea5]/30 rounded-full animate-slow-rotate" />
            <div className="absolute -inset-2 border-2 border-[#ffdea5]/20 rounded-full animate-slow-rotate" style={{ animationDirection: 'reverse' }} />
            <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-2xl bg-white border-4 border-[#ffdea5] flex items-center justify-center p-3">
              <img src="/Logo (2).png" alt="Vows of Elegance Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#ffdea5] mb-2 drop-shadow-md">
            Vows of Elegance
          </h1>
          <p className="font-body text-xs md:text-sm text-[#ffdea5]/90 uppercase tracking-[0.25em] font-semibold mb-8">
            Agrawal Biodata
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ffdea5] text-3xl animate-slow-rotate">
                auto_awesome
              </span>
            </div>
            <span className="text-xs uppercase tracking-widest shimmer-text font-semibold">
              Curating Your Royal Matches...
            </span>
          </div>

          <button
            onClick={onComplete}
            className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-[#775a19] to-[#b38827] text-white font-semibold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            <span>Enter Sanctum</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </main>

      <footer className="absolute bottom-6 w-full text-center z-10 opacity-40 flex items-center justify-center gap-3">
        <div className="h-[1px] w-12 bg-[#ffdea5]" />
        <span className="material-symbols-outlined text-[#ffdea5] text-sm">favorite</span>
        <div className="h-[1px] w-12 bg-[#ffdea5]" />
      </footer>
    </div>
  )
}
