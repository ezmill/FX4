var GlassShader = function(){
        this.uniforms = THREE.UniformsUtils.merge([
            {
                "texture"  : { type: "t", value: null },
                "origTex"  : { type: "t", value: null },
                "alpha"  : { type: "t", value: null },
                "mouse"  : { type: "v2", value: null },
                "mask"  : { type: "t", value: null },
                "resolution"  : { type: "v2", value: null },
                "time"  : { type: "f", value: null },
                "r2"  : { type: "f", value: null }

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
            "uniform sampler2D alpha;",
            "uniform sampler2D origTex;",
            "uniform sampler2D mask;",
            "uniform vec2 resolution;",
            "uniform vec2 mouse;",
            "uniform float r2;",
            "uniform float time;",
            "varying vec2 vUv;",

            "void main() {",

                "vec3 col = texture2D(texture, vUv).rgb;",
                "vec4 alpha = texture2D(alpha, vUv);",
                "vec4 mask = texture2D(mask, vUv);",
                // "vec4 origTex = texture2D(origTex, vUv);",
                "vec2 uv = gl_FragCoord.xy;",
                "gl_FragColor = texture2D(origTex, uv /= resolution.xy );",
                "uv += gl_FragColor.r / gl_FragColor.g - (sin(time)*0.25) - 1.0;",
                "gl_FragColor -= gl_FragColor - texture2D(texture, uv);",
                // "if(dot(mask.rgb, vec3(1.0))/3.0 < 0.0001){",
                // "    float f = smoothstep(r2, r2 - 0.5, r);",
                // "    col = mix( col, col2.rgb, f);",
                // "   col = mix( col, col2.rgb, dot(alpha.rgb, vec3(1.0))/3.0);",
                // "}",
                // "gl_FragColor = vec4(col,1.0);",
                // "gl_FragColor = col;",
            "}"


        
        ].join("\n");
}