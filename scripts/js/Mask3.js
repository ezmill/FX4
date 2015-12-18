function Mask(){
	this.scene, this.camera, this.renderer;
	this.mesh, this.material, this.geometry;
	this.shader;
	this.radius = 0.0;
	this.counter = 0;
	this.renderTarget1, this.renderTarget2;
	this.mouse;
	this.maskTex;
	this.oMesh;
	this.useRaster = false;
	this.init = function(){
		this.scene = new THREE.Scene();

	    this.camera = new THREE.OrthographicCamera( renderSize.x / - 2, renderSize.x / 2, renderSize.y / 2, renderSize.y / - 2, -10000, 10000 );
	   	this.camera.position.set(0,0,0);

		this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true});
		this.renderer.setSize( renderSize.x, renderSize.y );
		this.renderer.setClearColor(0x000000,1.0);
		// this.renderer.autoClear = false;

		
// 
		// this.oScene = new THREE.Scene();
	    // this.oCamera = new THREE.OrthographicCamera( renderSize.x / - 2, renderSize.x / 2, renderSize.y / 2, renderSize.y / - 2, -10000, 10000 );
	   	// this.oCamera.position.set(0,0,0);
		// this.oRenderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true});
		// this.oRenderer.setSize( renderSize.x, renderSize.y );
		// this.oRenderer.setClearColor(0xffffff,1.0);
		// this.oGeometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);
		// this.oMaterial = new THREE.MeshBasicMaterial({
			// map: this.alphaTex,
			// transparent: true
		// })
		// this.oMesh = new THREE.Mesh(this.oGeometry, this.oMaterial);
		// this.oScene.add(this.oMesh);
		// this.oMesh.position.z = 1;
		// this.oRenderTarget = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y);
		// this.oRenderTarget.minFilter = this.oRenderTarget.magFilter = THREE.LinearFilter;
		// 


		this.geometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);
		this.shader = new MaskShader();
		this.material = new THREE.ShaderMaterial({
			uniforms: this.shader.uniforms,
			fragmentShader: this.shader.fragmentShader,
			vertexShader: this.shader.vertexShader,
			transparent: true
		});
		this.material.uniforms["resolution"].value = new THREE.Vector2(renderSize.x, renderSize.y);
		this.material.uniforms["white"].value = THREE.ImageUtils.loadTexture("assets/textures/white.jpg");
		this.material.uniforms["white"].value.minFilter = THREE.LinearFilter;
		this.material.uniforms["white"].value.magFilter = THREE.LinearFilter;
		this.material.uniforms["black"].value = THREE.ImageUtils.loadTexture("assets/textures/black.jpg");
		this.material.uniforms["black"].value.minFilter = THREE.LinearFilter;
		this.material.uniforms["black"].value.magFilter = THREE.LinearFilter;
		this.material.uniforms["img"].value = THREE.ImageUtils.loadTexture("assets/textures/warp-transparent.png");
		this.material.uniforms["img"].value.minFilter = THREE.LinearFilter;
		this.material.uniforms["img"].value.magFilter = THREE.LinearFilter;
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.mesh);
		this.mesh.position.z = 0;


		this.renderTarget1 = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y);
		this.renderTarget1.minFilter = this.renderTarget1.magFilter = THREE.LinearFilter;
		this.renderTarget2 = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y);
		this.renderTarget2.minFilter = this.renderTarget2.magFilter = THREE.LinearFilter;

		this.maskTex = new THREE.Texture(this.renderer.domElement);
		this.maskTex.minFilter = this.maskTex.magFilter = THREE.LinearFilter;
		this.maskTex.needsUpdate = true;

		this.outputScene = new THREE.Scene();
	    this.outputCamera = new THREE.OrthographicCamera( renderSize.x / - 2, renderSize.x / 2, renderSize.y / 2, renderSize.y / - 2, -10000, 10000 );
	   	this.outputCamera.position.set(0,0,0);
		this.outputRenderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true});
		this.outputRenderer.setSize( renderSize.x, renderSize.y );
		this.outputRenderer.setClearColor(0xffffff,1.0);

		this.maskGeometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);
		this.maskMaterial = new THREE.MeshBasicMaterial({
			map: this.maskTex,
			transparent: true
		})
		this.maskMesh = new THREE.Mesh(this.maskGeometry, this.maskMaterial);
		this.outputScene.add(this.maskMesh);
		this.maskMesh.position.z = 0;

		this.alphaTex = THREE.ImageUtils.loadTexture("assets/textures/warp-transparent.png");
		this.alphaTex.minFilter = this.alphaTex.magFilter = THREE.LinearFilter;
		this.overlayGeometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);
		this.overlayMaterial = new THREE.MeshBasicMaterial({
			map: this.alphaTex,
			transparent: true
		})
		this.overlayMesh = new THREE.Mesh(this.overlayGeometry, this.overlayMaterial);
		this.outputScene.add(this.overlayMesh);
		this.overlayMesh.position.z = 1;
	}
	this.update = function(){
		// this.erase();
		this.material.uniforms["r2"].value = this.radius;
		this.material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
		// this.material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
		this.material.uniforms["time"].value = time;
		if(mouseDown){
			this.radius = 0.5;
		} else {
			this.radius = 0.0;
		}
		// this.overlayTexture.needsUpdate = true;
		this.maskTex.needsUpdate = true;

		this.renderer.render(this.scene, this.camera);
		this.renderer.render(this.scene, this.camera, this.renderTarget1);
		// this.oRenderer.render(this.oScene, this.oCamera, this.oRenderTarget);
		this.outputRenderer.render(this.outputScene, this.outputCamera);

		// this.overlayMesh.material.map.value = this.alphaTex;
		// this.alphaTex.needsUpdate = true;
		// this.renderer.render(this.scene, this.camera, this.renderTarget2);
		this.material.uniforms["black"].value = this.renderTarget1;
		this.swapBuffers();

	}
	this.setMask = function(tex){
		// this.useRaster = useRaster;
		// if(this.useRaster){
			// this.overlayMesh.visible = true;
		if(tex){
			this.overlayMesh.visible = true;
			this.overlayMesh.material.map = tex;				
		} else {
			this.overlayMesh.visible = false;
		}
	}
	this.swapBuffers = function(){
		var temp = this.renderTarget1;
		this.renderTarget1 = this.renderTarget2;
		this.renderTarget2 = temp;
	}
	this.resize = function(){
		this.renderer.setSize(renderSize.x, renderSize.y);
		this.renderTarget1.setSize(renderSize.x, renderSize.y);
		this.renderTarget2.setSize(renderSize.x, renderSize.y);
	}
}
function MaskShader(){
        this.uniforms = THREE.UniformsUtils.merge([
            {
                "mouse"  : { type: "v2", value: null },
                "resolution"  : { type: "v2", value: null },
                "time"  : { type: "f", value: 0.0 },
                "r2"  : { type: "f", value: null },
                "white"  : { type: "t", value: null },
                "black"  : { type: "t", value: null },
                "img" : { type: "t", value: null}
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

            "uniform vec2 resolution;",
            "uniform vec2 mouse;",
            "uniform sampler2D white;",
            "uniform sampler2D black;",
            "uniform sampler2D img;",
            "uniform float r2;",
            "uniform float time;",
            "varying vec2 vUv;",

            "void main() {",
            "	vec2 q = vUv;",
            "	vec2 p = -1.0 + 2.0*q;",
            "	p.x *= resolution.x/resolution.y;",
            "	vec2 m = mouse;",
            "	m.x *= resolution.x/resolution.y;",
            "	float r = sqrt( dot((p - m), (p - m)) );",
            "	float a = atan(p.y, p.x);",
            "	vec4 white = vec4(texture2D(white, vUv).rgb, 1.0);",
            "	vec4 black = vec4(texture2D(black, vUv).rgb, 1.0);;",
            "	vec4 img = vec4(texture2D(img, vUv).rgb, texture2D(img, vUv).a);;",
            "	if(r < r2){",
            "		float f = smoothstep(r2, r2-1.0, r);",
            "		black = mix( black, white, f);",
            "	}",
            // "	if(dot(img.rgb, vec3(1.0))/3.0 > 0.01){",
            // "		gl_FragColor = mix( black,  img, dot(img.rgb, vec3(1.0))/3.0);",
            // "		gl_FragColor = img;",
            // "	} else {",
            "		gl_FragColor = black;",
            // "		gl_FragColor = mix(black, img, 0.5);",
            // "		gl_FragColor = img;",
            // "	}",
            // "    float t=time;",
            // "    if(t<0.1)",
            // "    {",
            // "        gl_FragColor=black;",
            // "        return;",
            // "    }",
            // "    if(length(gl_FragCoord.xy-mouse.xy)>r2){",
            // "    	if(smoothstep()){",
            // "    		discard;",
            // "		}",
            // "	 }",
            // "	gl_FragColor = white;",
            "}",


        
        ].join("\n");
}