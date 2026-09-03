'use client';

import React, { useEffect, useRef } from 'react';

/* ────────────────────────────────────────────────────────────
   Living WebGL2 shader background used across the landing pages
   (hero, auth). Extracted so every surface shares one visual.
   ──────────────────────────────────────────────────────────── */

export const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

export type ShaderBackgroundProps = {
  fragmentSource?: string;
  dprMax?: number;
  clearColor?: [number, number, number, number];
  className?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
};

export default function ShaderBackground({
  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor = [0, 0, 0, 1],
  className = '',
  ariaLabel = 'Aurora shader background',
  style,
}: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;

    const compileShader = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(sh) || 'Unknown shader error';
        gl.deleteShader(sh);
        throw new Error(info);
      }
      return sh;
    };

    let prog: WebGLProgram;
    try {
      const v = compileShader(VERT_SRC, gl.VERTEX_SHADER);
      const f = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
      prog = gl.createProgram()!;
      gl.attachShader(prog, v);
      gl.attachShader(prog, f);
      gl.linkProgram(prog);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(prog) || 'Program link error';
        gl.deleteProgram(prog);
        throw new Error(info);
      }
    } catch (e) {
      console.error(e);
      return;
    }

    const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniTime = gl.getUniformLocation(prog, 'time');
    const uniRes = gl.getUniformLocation(prog, 'resolution');

    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

    const fit = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax));
      const rect = canvas.getBoundingClientRect();
      const W = Math.floor(Math.max(1, rect.width) * dpr);
      const H = Math.floor(Math.max(1, rect.height) * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const onResize = () => fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    window.addEventListener('resize', onResize);

    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (uniRes) gl.uniform2f(uniRes, canvas.width, canvas.height);
      if (uniTime) gl.uniform1f(uniTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [fragmentSource, dprMax, clearColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    />
  );
}
