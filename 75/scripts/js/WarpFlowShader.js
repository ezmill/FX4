var WarpFlowShader = function(){
        this.uniforms = THREE.UniformsUtils.merge( [

            {
                "texture"  : { type: "t", value: null },
                "alpha"  : { type: "t", value: null },
                "origTex"  : { type: "t", value: null },
                "mask"  : { type: "t", value: null },
                "mouse"  : { type: "v2", value: null },
                "time"  : { type: "f", value: null },
                "r2"  : { type: "f", value: null },
                "resolution"  : { type: "v2", value: null },
            }
        ] ),

        this.vertexShader = [
            "varying vec2 vUv;",
            "uniform float time;",
            "void main() {",
            "    vUv = uv;",
            "    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "}"
        ].join("\n"),

        this.fragmentShader = [
            "uniform vec2 resolution;",
            "uniform float time;",
            "uniform sampler2D texture;",
            "uniform sampler2D origTex;",
            "uniform sampler2D alpha;",
            "uniform sampler2D mask;",
            "varying vec2 vUv;",
            "uniform vec2 mouse;",
            "uniform float r2;",
            "vec3 rgb2hsv(vec3 c)",
            "{",
            "    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);",
            "    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));",
            "    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));",
            "    ",
            "    float d = q.x - min(q.w, q.y);",
            "    float e = 1.0e-10;",
            "    return vec3(abs(( (q.z + (q.w - q.y) / (6.0 * d + e))) ), d / (q.x + e), q.x);",
            "}",

            "vec3 hsv2rgb(vec3 c)",
            "{",
            "    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);",
            "    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);",
            "    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);",
            "}",
            "float rand(vec2 p)",
            "{",
            "    vec2 n = floor(p/2.0);",
            "     return fract(cos(dot(n,vec2(48.233,39.645)))*375.42); ",
            "}",
            "float srand(vec2 p)",
            "{",
            "     vec2 f = floor(p);",
            "    vec2 s = smoothstep(vec2(0.0),vec2(1.0),fract(p));",
            "    ",
            "    return mix(mix(rand(f),rand(f+vec2(1.0,0.0)),s.x),",
            "           mix(rand(f+vec2(0.0,1.0)),rand(f+vec2(1.0,1.0)),s.x),s.y);",
            "}",
            "float noise(vec2 p)",
            "{",
            "     float total = srand(p/128.0)*0.5+srand(p/64.0)*0.35+srand(p/32.0)*0.1+srand(p/16.0)*0.05;",
            "    return total;",
            "}",
            "vec3 hueGradient(float t) {",
            "    vec3 p = abs(fract(t + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);",
            "   return (clamp(p - 1.0, 0.0, 1.0));",
            "}",
            "float square(float s) { return s * s; }",
            "vec3 square(vec3 s) { return s * s; }",
            "vec3 neonGradient(float t) {",
            "   return clamp(vec3(t * 1.3 + 0.1, square(abs(0.43 - t) * 1.7), (1.0 - t) * 1.7), 0.0, 1.0);",
            "}",
            "vec3 heatmapGradient(float t) {",
            "   return (pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0));",
            "}",
            "vec3 electricGradient(float t) {",
            "    return clamp( vec3(t * 8.0 - 6.3, square(smoothstep(0.6, 0.9, t)), pow(t, 3.0) * 1.7), 0.0, 1.0);   ",
            "}",

            "void main()",
            "{",
            "    float t = time;",
            "    vec2 warp = vec2(noise(gl_FragCoord.xy+t)+noise(gl_FragCoord.xy*0.5+t*3.5),",
            "                     noise(gl_FragCoord.xy+128.0-t)+noise(gl_FragCoord.xy*0.6-t*2.5))*0.5-0.25;",
            // "    vec2 uv = gl_FragCoord.xy / resolution.xy+warp;",
            "    vec2 mW = warp*mouse;",
            "    vec2 uv = vUv+mW*sin(time);",
            "    vec4 look = texture2D(texture,uv);",
            "    vec2 offs = vec2(look.y-look.x,look.w-look.z)*vec2(mouse.x*uv.x/10.0, mouse.y*uv.y/10.0);",
            "    vec2 coord = offs+vUv;",
            "    vec4 repos = texture2D(texture, coord);",

            // "    gl_FragColor = repos;",
            "  vec4 tex0 = repos;",
            "  vec3 hsv = rgb2hsv(tex0.rgb);",
            "  hsv.r += 0.01;",
            "  //hsv.r = mod(hsv.r, 1.0);",
            "   ",
            "  hsv.g *= 1.001;",
            // "  // hsv.g = mod(hsv.g, 1.0);",
            "  vec3 rgb = hsv2rgb(hsv); ",
            // "  vec3 rgb = electricGradient(dot(tex0.rgb, vec3(1.0))); ",
            // "  vec3 rgb = electricGradient(hsv.r); ",

            "    vec2 q = vUv;",
            "    vec2 p = -1.0 + 2.0*q;",
            "    p.x *= resolution.x/resolution.y;",
            "    vec2 m = mouse;",
            "    m.x *= resolution.x/resolution.y;",
            "    float r = sqrt( dot((p - m), (p - m)) );",
            "    float a = atan(p.y, p.x);",
            "    vec3 col = texture2D(texture, vUv).rgb;",
            "    vec4 mask = texture2D(mask, vUv);",
            "    if(r < r2){",
            "        float f = smoothstep(r2, r2 - 0.5, r);",
            "        col = mix( col, rgb, f);",
            "    }",

            // "   vec4 alpha = texture2D(alpha, vUv);",
            // "   vec3 col = texture2D(texture, vUv).rgb;",
            // "   if(dot(mask.rgb, vec3(1.0))/3.0 > 0.1){",
            // "       col = mix( col, rgb, dot(alpha.rgb, vec3(1.0))/3.0);",
            // "       col = mix( col, rgb, dot(mask.rgb, vec3(1.0))/3.0);",
            // "   }",

            "gl_FragColor = vec4(col,1.0);",

            // "    gl_FragColor = vec4(col,1.0);",
            "}"
        ].join("\n")
}