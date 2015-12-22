var RevertShader = function(){
        this.uniforms = THREE.UniformsUtils.merge([
            {
                "texture"  : { type: "t", value: null },
                "origTex"  : { type: "t", value: null },
                "alpha"  : { type: "t", value: null },
                "mask"  : { type: "t", value: null },
                "mouse"  : { type: "v2", value: null },
                "resolution"  : { type: "v2", value: null },
                "time"  : { type: "f", value: null },
                "r2"  : { type: "f", value: null },
                "seed"  : { type: "f", value: null }

            }
        ]);

        this.vertexShader = [

            "varying vec2 vUv;",
            "void main() {",
            "    vUv = uv;",
            "    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "}"
        
        ].join("\n");
        
        this.fragmentShader = [
            
            "uniform sampler2D texture;",
            "uniform sampler2D origTex;",
            "uniform sampler2D mask;",
            "uniform sampler2D alpha;",
            "uniform vec2 resolution;",
            "uniform vec2 mouse;",
            "uniform float r2;",
            "uniform float seed;",
            "uniform float time;",
            "varying vec2 vUv;",
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


                    // "    vec2 q = vUv;",
                    // "    vec2 p = -1.0 + 2.0*q;",
                    // "    p.x *= resolution.x/resolution.y;",
                    // "    vec2 m = mouse;",
                    // "    m.x *= resolution.x/resolution.y;",
                    // "    float r = sqrt( dot((p - m), (p - m)) );",
                    // "    float a = atan(p.y, p.x);",
                    // "    vec3 col = texture2D(texture, vUv).rgb;",
                    // "    if(r < r2){",
                    // "        float f = smoothstep(r2, r2 - 0.5, r);",
                    // "        col = mix( col, rgb, f);",
                    // "    }",

                   
            "void main() {",

                // "float t = rand(vec2(0.5));",
                // "float t = seed;",
                "float t = time;",
                "vec2 warp = vec2(noise(gl_FragCoord.xy+t)+noise(gl_FragCoord.xy*0.5+t*3.5),",
                "                 noise(gl_FragCoord.xy+128.0-t)+noise(gl_FragCoord.xy*0.6-t*2.5))*0.5-0.25;",
                //"   vec2 uv = gl_FragCoord.xy / resolution.xy+warp;",
                "vec2 mW = warp;",
                "vec2 uv = vUv+mW*sin(t)*0.5;",
                "vec4 look = texture2D(origTex,uv);",
                "vec2 offs = vec2(look.y-look.x,look.w-look.z)*vec2(1.0*uv.x/10.0, 1.0*uv.y/10.0);",
                "vec2 coord = offs+vUv;",
                "vec4 repos = texture2D(origTex, coord);",

                "vec3 col = texture2D(texture, vUv).rgb;",
                "vec4 alpha = texture2D(alpha, vUv);",
                "vec4 mask = texture2D(mask, vUv);",
                // "vec4 col2 = texture2D(origTex, vUv);",
                
                // "col2*=2.0;",
                // "vec3 col2 = texture2D(texture, vUv).rgb*vec3(2.0,2.0,2.0);",
                "repos.rgb = mix(repos.rgb, col, 0.5);",
                // "if(dot(alpha.rgb, vec3(1.0))/3.0 > 0.00001){",
                // "    col *= vec3(1.0, 0.0, 0.0);   ",
                // "    float f = smoothstep(r2, r2 - 0.5, r);",
                // "    col = mix( col, col2, f);",
                "   col = mix( col, repos.rgb, dot(alpha.rgb, vec3(1.0))/3.0);",
                // "}",
                "gl_FragColor = vec4(col,1.0);",
            "}"


        
        ].join("\n");
}