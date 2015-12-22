;(function (root, document, factory) {
    root.blackbox = factory()
})(this, this.document, function () {

/**
 * @param {DOMNode} el
 * @param {string} inputImage
 * @param {string} origImage
 * @param {object} size
 * @param {number} size.w
 * @param {number} size.h
 * @param {object} cbs
 * @param {function} cbs.save
 * @param {function} cbs.info
 */
function blackbox(el, inputImage, origImage, size, cbs) {
    // Create the Blackbox's UI elements wrapper.
    var div = document.createElement('div')
    div.className = 'blackbox'
    div.style.overflow = "hidden";
    div.style.height = "100vh";
    div.style.width = "100vw";
    var marginLeft = 1000;
    var renderSize;
    var imgNum = 1;
    var path = "assets/textures/" + imgNum + "/";
    var mouse = new THREE.Vector2(0.0, 0.0);
    var time = 0.0;
    var mouseDown = false;
    var r2 = 0.0;
    var origTex, origImage;
    var w = size.w,
        h = size.h
    if (window.innerWidth > w * (window.innerHeight / h)) {
        renderSize = new THREE.Vector2(window.innerWidth, h * (window.innerWidth / w));
    } else {
        renderSize = new THREE.Vector2(w * (window.innerHeight / h), window.innerHeight);
    }
    var scene, camera, light, renderer, texture, fbMaterial, mask;
    var effectIndex = 0;
    var id;
    var effects = ["warp",
        "revert",
        "rgb shift",
        "oil paint",
        "repos",
        "flow",
        "gradient",
        "warp flow",
        "curves",
        "neon glow"
    ]
    var mask1 = THREE.ImageUtils.loadTexture(path + "mask1.png");
    mask1.minFilter = mask1.magFilter = THREE.LinearFilter;
    var mask2 = THREE.ImageUtils.loadTexture(path + "mask2.png");
    mask2.minFilter = mask2.magFilter = THREE.LinearFilter;
    var revertTex = THREE.ImageUtils.loadTexture(path + "revert.png");
    revertTex.minFilter = revertTex.magFilter = THREE.LinearFilter;
    var infoButton = document.createElement("div");
    var uploadButton = document.createElement("div");
    var icons = document.createElement("div");
    icons.style["position"] = "fixed";
    icons.style["top"] = 0;
    icons.style["left"] = 0;
    icons.style["right"] = 0;
    icons.style["bottom"] = 0;
    icons.style["width"] = window.innerWidth;
    icons.style["height"] = window.innerHeight;
    icons.style["font-size"] = 48;
    uploadButton.style["position"] = infoButton.style["position"] = "absolute";
    uploadButton.style["right"] = infoButton.style["right"] = 0;
    uploadButton.style["margin"] = infoButton.style["margin"] = "20px";
    uploadButton.style["cursor"] = infoButton.style["cursor"] = "pointer";
    uploadButton.style["font-size"] = infoButton.style["font-size"] = "48px";
    uploadButton.style["bottom"] = 0;
    var infoIcon = document.createElement("i");
    infoIcon.className = "pe-7s-info";
    var uploadIcon = document.createElement("i");
    uploadIcon.className = "pe-7s-upload";
    infoButton.appendChild(infoIcon);
    uploadButton.appendChild(uploadIcon);
    icons.appendChild(infoButton);
    icons.appendChild(uploadButton);
    div.appendChild(icons);
    //to-do splice in BASE shader at first index and then remove after starting
    var infoCounter = 0;
    var soundFX = [];
    var backingTrack = new SoundEffect("assets/audio/backing.mp3");
    backingTrack.fadeIn();
    var rendererStats  = new THREEx.RendererStats()
    rendererStats.domElement.style.position   = 'absolute'
    rendererStats.domElement.style.left  = '0px'
    rendererStats.domElement.style.bottom    = '0px'
    document.body.appendChild( rendererStats.domElement )

    init();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.Camera();
        camera.position.z = 1;
        renderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true
        });
        renderer.setSize(renderSize.x, renderSize.y);
        renderer.setClearColor(0xffffff, 1.0);
        createEffect();

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener('touchstart', onDocumentTouchStart, false);
        document.addEventListener('touchmove', onDocumentTouchMove, false);
        document.addEventListener('touchend', onDocumentTouchEnd, false);
        document.addEventListener('touchcancel', onDocumentTouchEnd, false);
        document.addEventListener('touchleave', onDocumentTouchEnd, false);
        document.addEventListener('keydown', onKeyDown, false);
        window.addEventListener("resize", onWindowResize);
        infoButton.addEventListener("click", cbs.info);
        infoButton.addEventListener("touchstart", cbs.info);
        infoButton.addEventListener("touchdown", cbs.info);
        onWindowResize();
        animate();
    }
    function createSoundEffects(effects){
        var path = "assets/audio/"
        var format = ".mp3";
        for(var i = 0; i < effects.length; i++){
            var src = path + effects[i] + format;
            var sound = new SoundEffect(src, effects[i]);
            soundFX.push(sound);
        }
    }
    function createEffect() {
        shuffle(effects);
        insertRevert(effects);
        createSoundEffects(effects);
        effectIndex = 0;
        if (texture) texture.dispose();
        if (origTex) origTex.dispose();
        // var blob = dataURItoBlob(base64);
        // var file = window.URL.createObjectURL(blob);
        var img = new Image();
        img.src = inputImage;
        var origImg = new Image();
        origImg.src = origImage;
        // console.log(img);
        // image.src = base64;
        texture = new THREE.Texture();
        texture.image = img;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        origTex = new THREE.Texture();
        // origTex = THREE.ImageUtils.loadTexture("assets/textures/newtest.jpg");
        origTex.image = img;
        origTex.minFilter = origTex.magFilter = THREE.LinearFilter;
        // origTex = texture.clone();
        effect = new Effect(effects[effectIndex]);
        effect.init();
        mask = new Mask();
        mask.init();
        mask.update();
        alpha = new THREE.Texture(mask.renderer.domElement);
        alpha.minFilter = alpha.magFilter = THREE.LinearFilter;
        alpha.needsUpdate = true;

        if (fbMaterial) fbMaterial.dispose();
        fbMaterial = new FeedbackMaterial(renderer, scene, camera, texture, effect.shaders);
        fbMaterial.init();
        if (effect.name == "neon glow") {
            mask.setMask(mask1);
        } else if (effect.name == "rgb shift" || effect.name == "oil paint" || effect.name == "flow" || effect.name == "warp flow" || effect.name == "repos" || effect.name == "revert" || effect.name == "warp") {
            mask.setMask(mask2);
            fbMaterial.setMask(revertTex)
        } else {
            mask.setMask(false);
        }
        fbMaterial.setOriginalTex(origTex);
        img.onload = function() {
            texture.needsUpdate = true;
        }
        origImg.onload = function() {
            origTex.needsUpdate = true;
        }
    }

    function createNewEffect() {
        var useNewOriginal = false;
        if (effectIndex == effects.length - 1) {
            effectIndex = 0;
        } else {
            effectIndex++;
        }
        if (effects[effectIndex] == "neon glow") {
            useNewOriginal = true;
        } else if (effects[effectIndex] == "rgb shift" || effects[effectIndex] == "oil paint" || effects[effectIndex] == "flow" || effects[effectIndex] == "warp flow" || effects[effectIndex] == "repos") {
            useNewOriginal = true;
        } else if (effects[effectIndex] == "warp") {
            useNewOriginal = true;
        } else if (effects[effectIndex] == "revert"){
            useNewOriginal = false;
        } else {
            useNewOriginal = false;            
        }

        // var blob = dataURItoBlob(renderer.domElement.toDataURL('image/jpg'));
        // var file = window.URL.createObjectURL(blob);
        // var img = new Image();
        // img.src = file;
        // img.onload = function(e) {
            // texture.image = img;
            fbMaterial.update();
            renderer.render(scene, camera);
            fbMaterial.getNewFrame();
            fbMaterial.swapBuffers();
            texture.dispose();
            texture.image = renderer.domElement;
            // texture = new THREE.Texture(renderer.domElement);
            texture.needsUpdate = true;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;
            // fbMaterial.setUniforms();

            // texture.needsUpdate = true;

            effect = new Effect(effects[effectIndex]);
            effect.init();
                // mask = new Mask();
                // mask.init();
                // mask.update();
                // mask.renderer.autoClear = true;
                // mask.renderer.clearDepth(0x000000);
                mask.renderer.clearDepth();
                mask.renderer.clearTarget(mask.renderTarget1,0x000000);
                mask.renderer.clearTarget(mask.renderTarget2,0x000000);
                mask.renderer.clear();
                // mask.update()
                // mask.renderer.autoClear = false;
                // mask.outputRenderer.clear();
                // alpha.dipose();
                // alpha = new THREE.Texture(mask.renderer.domElement);
                // alpha.minFilter = alpha.magFilter = THREE.LinearFilter;
                // alpha.needsUpdate = true;

            fbMaterial.dispose();
            fbMaterial = new FeedbackMaterial(renderer, scene, camera, texture, effect.shaders);
            fbMaterial.init();
            if (effect.name == "neon glow") {
                mask.setMask(mask1);
            } else if (effect.name == "rgb shift" || effect.name == "oil paint" || effect.name == "flow" || effect.name == "warp flow" || effect.name == "repos" || effect.name == "revert" || effect.name == "warp") {
                mask.setMask(mask2);
                fbMaterial.setMask(revertTex)
            } else {
                mask.setMask(false);
            }
            if (useNewOriginal) {
                fbMaterial.setOriginalTex(texture);
            } else {
                fbMaterial.setOriginalTex(origTex);
            }
        // }
    }

    function animate() {
        id = requestAnimationFrame(animate);
        draw();
    }

    function draw() {
        time += 0.01;
        if (mouseDown) {
            if(effect.name == "gradient"){
                r2 += 0.0075;
                mask.radius += 0.0075;
            } else {
                r2 = 0.5;
                mask.radius = 0.5;
            }
        }
        mask.update();
        alpha.needsUpdate = true;
        backingTrack.update();
        for(var i = 0; i < soundFX.length; i++){
            soundFX[i].update();
        }
        fbMaterial.setUniforms();
        fbMaterial.update();
        renderer.render(scene, camera);
        fbMaterial.getNewFrame();
        fbMaterial.swapBuffers();
        rendererStats.update(renderer);
    }
    div.appendChild(renderer.domElement)
    // Put a "Save" button the the wrapper.
    // button.type = 'button'
    // button.innerHTML = 'Save'
    uploadButton.addEventListener('click', onClickButton)
    // div.appendChild(button)

    // Attach the wrapper and its content to the root element.
    el.appendChild(div)

    // Render the input image data to the canvas.
    var image = new Image()
    image.src = renderer.domElement.toDataURL('image/jpeg');
    // el.appendChild(image);
    // This function is called on the "Save" button click.
    function onClickButton() {
        // Remove the button's event listener.
        uploadButton.removeEventListener('click', onClickButton)
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener('touchstart', onDocumentTouchStart, false);
        document.removeEventListener('touchmove', onDocumentTouchMove, false);
        document.removeEventListener('touchend', onDocumentTouchEnd, false);
        document.removeEventListener('touchcancel', onDocumentTouchEnd, false);
        document.removeEventListener('touchleave', onDocumentTouchEnd, false);
        document.removeEventListener('keydown', onKeyDown, false);
        window.removeEventListener("resize", onWindowResize);
        infoButton.removeEventListener("click", cbs.info);
        infoButton.removeEventListener("touchstart", cbs.info);
        infoButton.removeEventListener("touchdown", cbs.info);
        // Detach the UI wrapper and its content from the root element.
        el.removeChild(div)

        // Call the callback function, passing the new canvas content to it.
        // if (window.innerWidth > imgEl.width * (window.innerHeight / imgEl.height)) {
            // renderSize = new THREE.Vector2(window.innerWidth, imgEl.height * (window.innerWidth / imgEl.width));
        // } else {
            // renderSize = new THREE.Vector2(imgEl.width * (window.innerHeight / imgEl.height), window.innerHeight);
        // }
        renderer.setSize(renderSize.x, renderSize.y);
        mask.resize();
        fbMaterial.resize();
        fbMaterial.setUniforms();
        mask.update();
        fbMaterial.setUniforms();
        fbMaterial.update();
        renderer.render(scene, camera);
        fbMaterial.getNewFrame();
        fbMaterial.swapBuffers();

        var base64 = renderer.domElement.toDataURL('image/jpeg');

        cancelAnimationFrame(id); // Stop the animation
        // scene = null;
        // camera = null;
        cbs.save(null, base64, origImage);
    }

    function dataURItoBlob(dataURI) {
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {
            type: mimeString
        });
    }

    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function insertRevert(array) {
        var length = array.length;
        for (var i = 0; i < length; i++) {
            if (array[i] == "revert") {
                array.splice(i, 1);
            }
        }
        for (var i = 0; i < length; i++) {
            if (array[i] == "flow" || array[i] == "repos") {
                array.splice(i + 1, 0, "revert");
            }
        }
        var startEffects = ["rgb shift", "neon glow", "curves", "oil paint", "warp"];
        var startEffectNum = Math.floor(Math.random() * startEffects.length);
        var startEffect = startEffects[startEffectNum];
        console.log(startEffect);
        for (var i = 0; i < length; i++) {
            if (array[i] == startEffect) {
                array.splice(i, 1);
            }
        }
        array.splice(0, 0, startEffect);
        console.log(array);
    }

    function onMouseMove(event) {
        // mouse.x = ( event.pageX / renderSize.x ) * 2 - 1;
        // mouse.y = - ( event.pageY / renderSize.y ) * 2 + 1;
        mouse.x = (event.pageX / renderSize.x) * 2 - 1;
        mouse.y = -(event.pageY / renderSize.y) * 2 + 1;
        mask.mouse = new THREE.Vector2(mouse.x, mouse.y);
    }

    function onMouseDown() {
        mouseDown = true;
        soundFX[effectIndex].fadeIn();
    }

    function onMouseUp() {
        if(effect.name != "gradient"){
            mouseDown = false;
            r2 = 0;
            mask.radius = 0;
            soundFX[effectIndex].fadeOut();
            createNewEffect();
        } else {
            document.removeEventListener("mousedown", onMouseDown);
            window.setTimeout(function(){
                mouseDown = false;
                r2 = 0;
                mask.radius = 0;
                soundFX[effectIndex].fadeOut();
                createNewEffect();
                document.addEventListener("mousedown", onMouseDown);
            }, 2000)
        }

    }

    function onDocumentTouchStart(event) {
        mouseDown = true;
        updateMouse(event);
    }

    function onDocumentTouchMove(event) {
        mouseDown = true;
        updateMouse(event);
    }

    function updateMouse(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouse.x = (event.touches[0].pageX / renderSize.x) * 2 - 1;
            mouse.y = -(event.touches[0].pageY / renderSize.y) * 2 + 1;
            mask.mouse = new THREE.Vector2(mouse.x, mouse.y);
        }
    }

    function onDocumentTouchEnd(event) {
        mouseDown = false;
        r2 = 0;
        mask.radius = 0;
        createNewEffect();
    }

    function onWindowResize(event) {

        if (window.innerWidth > imgEl.width * (window.innerHeight / imgEl.height)) {
            renderSize = new THREE.Vector2(window.innerWidth, imgEl.height * (window.innerWidth / imgEl.width));
        } else {
            renderSize = new THREE.Vector2(imgEl.width * (window.innerHeight / imgEl.height), window.innerHeight);
        }
        renderer.setSize(renderSize.x, renderSize.y);
        // camera.left = renderSize.x / - 2;
        // camera.right = renderSize.x / 2;
        // camera.top = renderSize.y / 2;
        // camera.bottom = renderSize.y / - 2;
        mask.resize();
        fbMaterial.resize();
        fbMaterial.setUniforms();
        // if(marginLeft > window.innerWidth){
        // console.log(window.innerWidth - marginLeft);
        // renderer.domElement.style["margin-left"] = window.innerWidth - marginLeft + "px";
        // } else {
        // renderer.domElement.style["margin-left"] = 0;
        // }
    }

    function onKeyDown(event) {
         if(event.keyCode == "39"){
            if(imgNum < 13){
                imgNum++;
            } else {
                imgNum = 1;
            }
            path = "assets/textures/" + imgNum + "/";
            inputImage = path + "texture.jpg";
            createEffect();
        }
        if(event.keyCode == "37"){
            if(imgNum == 1){
                imgNum = 12;
            } else {
                imgNum--;
            }
            path = "assets/textures/" + imgNum + "/";
            inputImage = path + "texture.jpg";
            createEffect();
        }
    
    }
    /**

Below this comment are dependencies

*/
    function FeedbackMaterial(RENDERER, SCENE, CAMERA, TEXTURE, SHADERS) {

        this.renderer = RENDERER;
        this.scene = SCENE;
        this.camera = CAMERA;
        this.texture = TEXTURE;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.mask, this.origTex;
        this.shader1 = SHADERS[0];
        this.shader2 = SHADERS[1];
        this.shader3 = SHADERS[2];
        // this.shader4 = SHADERS[3];
        // this.shader5 = SHADERS[4];
        this.outputShader = SHADERS[3]

        this.mesh;

        //this.geometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);


        this.fbos = [];
        this.init = function() {
            this.fbos[0] = new FeedbackObject(this.shader1);
            this.fbos[0].material.uniforms.texture.value = this.texture;

            this.fbos[1] = new FeedbackObject(this.shader2);
            this.fbos[1].material.uniforms.texture2.value = this.texture;
            this.fbos[1].material.uniforms.texture.value = this.fbos[0].renderTarget;

            this.fbos[2] = new FeedbackObject(this.shader3);
            this.fbos[2].material.uniforms.texture.value = this.fbos[1].renderTarget;

            // this.fbos.push(this.fbo1);
            // this.fbos.push(this.frameDiff);
            // this.fbos.push(this.fbo2);
            // 
            for (var i = 0; i < this.fbos.length; i++) {
                this.fbos[i].material.uniforms.resolution.value = new THREE.Vector2(renderSize.x, renderSize.y);
            }


            this.material = new THREE.ShaderMaterial({
                uniforms: this.outputShader.uniforms,
                vertexShader: this.outputShader.vertexShader,
                fragmentShader: this.outputShader.fragmentShader,
                transparent: true,
                side: 2
            });
            this.material.uniforms["texture"].value = this.fbos[2].renderTarget;
            this.material.uniforms["texture"].minFilter = this.material.uniforms["texture"].magFilter = THREE.LinearFilter;
            this.material.uniforms["resolution"].value = new THREE.Vector2(renderSize.x, renderSize.y);
            this.material.uniforms["mouse"].value = new THREE.Vector2(renderSize.x, 0);

            this.geometry = new THREE.PlaneGeometry(2, 2, 0);

            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.mesh.position.set(0, 0, 0);
            this.scene.add(this.mesh);

            // this.setUniforms();
            // this.update();

            this.fbos[0].material.uniforms.texture.value = this.fbos[1].renderTarget;
            // this.getNewFrame();

        }

        this.resize = function() {
            for (var i = 0; i < this.fbos.length; i++) {
                this.fbos[i].renderTarget.setSize(renderSize.x, renderSize.y);
                // this.fbos[i].geometry.dispose();
                // this.fbos[i].mesh.scale(renderSize.x/oldX, renderSize.y/oldY,0)
                // 
                // this.geometry.dispose();
                // this.geometry = new THREE.PlaneGeometry(renderSize.x, renderSize.y, 0);
            }
            // this.mesh.scale(renderSize.x/oldX, renderSize.y/oldY,0)

        }

        this.update = function() {
            // this.fbo2.render(this.renderer, this.camera);
            this.fbos[1].render(this.renderer, this.camera);
            this.fbos[2].render(this.renderer, this.camera);
            this.fbos[2].material.uniforms["texture"].value.needsUpdate = true;

            // this.fbo4.render(this.renderer, this.camera);
        }
        this.expand = function(scl) {
            this.frameDiff.mesh.scale.set(scl, scl, scl);
        }
        this.scale = function(scl) {
            for (var i = 0; i < this.fbos.length; i++) {
                this.fbos[i].mesh.scale.set(scl, scl, scl);
            }
        }
        this.getNewFrame = function() {
            this.fbos[0].render(this.renderer, this.camera);
        }
        this.swapBuffers = function() {
            var a = this.fbos[2].renderTarget;
            this.fbos[2].renderTarget = this.fbos[0].renderTarget;
            this.fbos[0].renderTarget = a;
        }
        this.setUniforms = function() {
            for (var i = 0; i < this.fbos.length; i++) {
                this.fbos[i].material.uniforms.time.value = time;
                this.material.uniforms.time.value = time;
                if (this.fbos[i].material.uniforms["r2"]) this.fbos[i].material.uniforms["r2"].value = r2;
                if (this.material.uniforms["r2"]) this.material.uniforms["r2"].value = r2;
                if (this.fbos[i].material.uniforms["resolution"]) this.fbos[i].material.uniforms["resolution"].value = new THREE.Vector2(renderSize.x, renderSize.y);
                if (this.material.uniforms["resolution"]) this.material.uniforms["resolution"].value = new THREE.Vector2(renderSize.x, renderSize.y);
                if (this.fbos[i].material.uniforms["alpha"]) this.fbos[i].material.uniforms["alpha"].value = alpha;
                if (this.material.uniforms["alpha"]) this.material.uniforms["alpha"].value = alpha;
                if (this.fbos[i].material.uniforms["mouse"]) this.fbos[i].material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
                if (this.material.uniforms["mouse"]) this.material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
                if (this.material.uniforms["curveMap"]) this.material.uniforms["curveMap"].value.needsUpdate = true;
                // if(this.material.uniforms["mask"])this.material.uniforms["mask"].value.needsUpdate = true;
                if (this.material.uniforms["mask"]) this.material.uniforms["mask"].value = this.mask;

                if (this.fbos[i].material.uniforms["origTex"]) this.fbos[i].material.uniforms["origTex"].value = this.origTex;
                if (this.material.uniforms["origTex"]) this.material.uniforms["origTex"].value = this.origTex;
                if (this.fbos[i].material.uniforms["seed"]) this.fbos[i].material.uniforms["seed"].value = seed;
                if (this.material.uniforms["seed"]) this.material.uniforms["seed"].value = seed;
            }
        }
        this.setMask = function(tex) {
            this.mask = tex;
            // origTex = this.fbos[2].renderTarget.clone();
        }
        this.setOriginalTex = function(tex) {
            this.origTex = tex;
            // origTex = this.fbos[2].renderTarget.clone();
        }
        this.dispose = function() {
            for (var i = 0; i < this.fbos.length; i++) {
                this.fbos[i].dispose();
            }
            this.material.dispose();
            this.geometry.dispose();
            this.scene.remove(this.mesh)
        }
    }

    function FeedbackObject(SHADER) {
        this.scene = new THREE.Scene();
        this.renderTarget, this.shader, this.material, this.geometry, this.mesh;
        this.initialize = function(SHADER) {
            this.renderTarget = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat
            });
            this.shader = SHADER;
            this.material = new THREE.ShaderMaterial({
                uniforms: this.shader.uniforms,
                vertexShader: this.shader.vertexShader,
                fragmentShader: this.shader.fragmentShader
            });
            this.geometry = new THREE.PlaneGeometry(2, 2);
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.mesh.position.set(0, 0, 0);
            this.scene.add(this.mesh);
        }
        this.initialize(SHADER);
        this.render = function(RENDERER, CAMERA) {
            RENDERER.render(this.scene, CAMERA, this.renderTarget, true);
        }
        this.dispose = function() {
            this.renderTarget.dispose();
            this.material.dispose();
            this.material.uniforms.texture.value.dispose();
            this.geometry.dispose();
            this.scene.remove(this.mesh);
        }
    }

    function Effect(NAME) {
        this.shaders;
        this.blendId;
        this.name = NAME;
        this.curves = [
            [
                [
                    [0, 0],
                    [0.349, 0.448],
                    [0.493, 0.626],
                    [0.77, 0.814],
                    [1, 1]
                ],
                [
                    [0, 0.171],
                    [0.349, 0.394],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.304, 0.27],
                    [0.577, 0.423],
                    [0.73, 0.715],
                    [1, 1]
                ]
            ],

            [
                [
                    [0, 0.235],
                    [0.324, 0.369],
                    [1, 1]
                ],
                [
                    [0.057, 0],
                    [0.5, 0.473],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.646, 0.547],
                    [1, 1]
                ]
            ],

            [
                [
                    [0, 0],
                    [0.087, 0.141],
                    [0.434, 0.478],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.661, 0.6],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.24, 0.235],
                    [0.5, 0.483],
                    [0.795, 0.9],
                    [1, 1]
                ]
            ],

            [
                [
                    [0, 0],
                    [0.287, 0.193],
                    [0.718, 0.792],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.394, 0.374],
                    [0.824, 0.879],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.205, 0.23],
                    [0.725, 0.641],
                    [1, 0.893]
                ]
            ],

            [
                [
                    [0, 0],
                    [0.626, 0.667],
                    [0.755, 0.874],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.423, 0.621],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.66, 0.67],
                    [1, 1]
                ]
            ],

            [
                [
                    [0, 0],
                    [0.557, 0.413],
                    [0.79, 0.755],
                    [1, 1]
                ],
                [
                    [0, 0],
                    [0.666, 0.661],
                    [0.889, 1]
                ],
                [
                    [0, 0],
                    [0.156, 0.21],
                    [0.468, 0.453],
                    [1, 1]
                ]
            ]
        ]
        this.init = function() {
            switch (this.name) {
                case "warp":
                    this.shaders = this.warpEffect();
                    break;
                case "revert":
                    seed = Math.random() * 2 - 1;
                    this.shaders = this.revertEffect();
                    break;
                case "rgb shift":
                    this.shaders = this.rgbShiftEffect();
                    break;
                case "oil paint":
                    this.shaders = this.oilPaintEffect();
                    break;
                case "repos":
                    this.shaders = this.reposEffect();
                    break;
                case "flow":
                    this.shaders = this.flowEffect();
                    break;
                case "gradient":
                    this.shaders = this.gradientEffect();
                    break;
                case "warp flow":
                    this.shaders = this.warpFlowEffect();
                    break;
                case "curves":
                    var curveNum = Math.floor(Math.random() * this.curves.length)
                    this.shaders = this.curvesEffect(
                        this.curves[curveNum][0],
                        this.curves[curveNum][1],
                        this.curves[curveNum][2]
                    );
                    break;
                case "neon glow":
                    this.shaders = this.neonGlowEffect();
                    break;
                case "glass":
                    this.shaders = this.glassEffect();
            }
        }
        this.warpEffect = function() {
            var customShaders = new CustomShaders();
            var shaders = [
                customShaders.passShader,
                customShaders.diffShader2,
                customShaders.passShader,
                customShaders.warp2
            ]
            return shaders;
        }
        this.revertEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var revertShader = new RevertShader();
            var denoiseShader = new DenoiseShader();
            var shaders = [
                    customShaders.passShader,
                    customShaders.diffShader2,
                    customShaders2.passShader,
                    revertShader
                ]
            return shaders;
        }
        this.rgbShiftEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var rgbShiftShader = new RgbShiftShader();
            var shaders = [
                customShaders2.passShader,
                customShaders.diffShader2,
                customShaders.passShader,
                rgbShiftShader
            ]
            return shaders;
        }
        this.oilPaintEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var oilPaintShader = new OilPaintShader();
            var shaders = [
                customShaders.passShader,
                customShaders.diffShader2,
                customShaders2.passShader,
                oilPaintShader
            ]
            return shaders;
        }
        this.reposEffect = function() {
            var customShaders = new CustomShaders();
            var denoiseShader = new DenoiseShader();
            var customShaders2 = new CustomShaders();
            var psdMaskShader = new PSDMaskShader();
            var shaders = [
                customShaders.reposShader,
                customShaders.diffShader,
                customShaders.passShader,
                psdMaskShader,
            ]
            return shaders;
        }
        this.flowEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var psdMaskShader = new PSDMaskShader();
            var shaders = [
                customShaders.flowShader,
                customShaders.diffShader,
                customShaders.passShader,
                psdMaskShader,
            ]
            return shaders;
        }
        this.gradientEffect = function() {
            var customShaders = new CustomShaders();
            var gradientShader = new GradientShader();
            var customShaders2 = new CustomShaders();
            var shaders = [
                customShaders.passShader,
                customShaders.diffShader2,
                customShaders2.passShader,
                gradientShader

            ]
            return shaders;
        }
        this.warpFlowEffect = function() {
            var customShaders = new CustomShaders();
            var warpFlowShader = new WarpFlowShader();
            var psdMaskShader = new PSDMaskShader();
            var gradientShader = new GradientShader();
            var shaders = [
                customShaders.flowShader,
                customShaders.diffShader,
                warpFlowShader,
                // customShaders.passShader,
                psdMaskShader,
            ]
            return shaders;
        }
        this.curvesEffect = function(red, green, blue) {
            var customShaders = new CustomShaders();
            var curvesShader = new CurvesShader(red, green, blue);
            var gradientShader = new GradientShader();
            var shaders = [
                customShaders.passShader,
                customShaders.diffShader2,
                customShaders.passShader,
                curvesShader
            ]
            return shaders;
        }
        this.neonGlowEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var neonGlowShader = new NeonGlowShader();
            var shaders = [
                customShaders2.passShader,
                customShaders.diffShader2,
                customShaders.passShader,
                neonGlowShader
            ]
            return shaders;
        }
        this.glassEffect = function() {
            var customShaders = new CustomShaders();
            var customShaders2 = new CustomShaders();
            var glassShader = new GlassShader();
            var shaders = [
                customShaders2.passShader,
                customShaders.diffShader2,
                customShaders.passShader,
                glassShader
            ]
            return shaders;
        }
    }

    function Mask() {
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
        this.init = function() {
            this.scene = new THREE.Scene();

            this.camera = new THREE.OrthographicCamera(renderSize.x / -2, renderSize.x / 2, renderSize.y / 2, renderSize.y / -2, -10000, 10000);
            this.camera.position.set(0, 0, 0);

            this.renderer = new THREE.WebGLRenderer({
                preserveDrawingBuffer: true
            });
            this.renderer.setSize(renderSize.x, renderSize.y);
            this.renderer.setClearColor(0x000000, 1.0);
            this.renderer.autoClear = false;


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
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.scene.add(this.mesh);
            this.mesh.position.z = 0;


            this.renderTarget1 = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y);
            this.renderTarget1.minFilter = this.renderTarget1.magFilter = THREE.LinearFilter;
            this.renderTarget2 = new THREE.WebGLRenderTarget(renderSize.x, renderSize.y);
            this.renderTarget2.minFilter = this.renderTarget2.magFilter = THREE.LinearFilter;

            // this.maskTex = new THREE.Texture(this.renderer.domElement);
            // this.maskTex.minFilter = this.maskTex.magFilter = THREE.LinearFilter;
            // this.maskTex.needsUpdate = true;

            this.outputScene = new THREE.Scene();
            this.outputCamera = new THREE.OrthographicCamera(renderSize.x / -2, renderSize.x / 2, renderSize.y / 2, renderSize.y / -2, -10000, 10000);
            this.outputCamera.position.set(0, 0, 0);
            // this.outputRenderer = new THREE.WebGLRenderer({
                // preserveDrawingBuffer: true
            // });
            // this.outputRenderer.setSize(renderSize.x, renderSize.y);
            // this.outputRenderer.setClearColor(0xffffff, 1.0);

            // this.maskGeometry = new THREE.PlaneBufferGeometry(renderSize.x, renderSize.y);
            // this.maskMaterial = new THREE.MeshBasicMaterial({
                // map: this.maskTex,
                // transparent: true
            // })
            // this.maskMesh = new THREE.Mesh(this.maskGeometry, this.maskMaterial);
            // this.outputScene.add(this.maskMesh);
            // this.maskMesh.position.z = 0;

            this.alphaTex = THREE.ImageUtils.loadTexture(path + "mask2.png");
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
        this.update = function() {
            // this.erase();
            this.material.uniforms["r2"].value = this.radius;
            this.material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
            // this.material.uniforms["mouse"].value = new THREE.Vector2(mouse.x, mouse.y);
            this.material.uniforms["time"].value = time;
            if (mouseDown) {
                // this.radius = 0.5;
            } else {
                // this.radius = 0.0;
            }
            // this.overlayTexture.needsUpdate = true;
            // this.maskTex.needsUpdate = true;
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
            this.renderer.render(this.scene, this.camera, this.renderTarget1);
            // this.oRenderer.render(this.oScene, this.oCamera, this.oRenderTarget);
            this.renderer.clearDepth();

            this.renderer.render(this.outputScene, this.outputCamera);

            // this.overlayMesh.material.map.value = this.alphaTex;
            // this.alphaTex.needsUpdate = true;
            // this.renderer.render(this.scene, this.camera, this.renderTarget2);
            this.material.uniforms["black"].value = this.renderTarget1;
            this.swapBuffers();

        }
        this.setMask = function(tex) {
            // this.useRaster = useRaster;
            // if(this.useRaster){
            // this.overlayMesh.visible = true;
            if (tex) {
                this.overlayMesh.visible = true;
                this.overlayMesh.material.map = tex;
            } else {
                this.overlayMesh.visible = false;
            }
        }
        this.swapBuffers = function() {
            var temp = this.renderTarget1;
            this.renderTarget1 = this.renderTarget2;
            this.renderTarget2 = temp;
        }
        this.resize = function() {
            this.renderer.setSize(renderSize.x, renderSize.y);
            this.renderTarget1.setSize(renderSize.x, renderSize.y);
            this.renderTarget2.setSize(renderSize.x, renderSize.y);
            // this.renderer.setSize(renderSize.x, renderSize.y);
            // this.outputRenderer.setSize(renderSize.x, renderSize.y);
            this.camera.left = this.outputCamera.left = renderSize.x / -2;
            this.camera.right = this.outputCamera.right = renderSize.x / 2;
            this.camera.top = this.outputCamera.top = renderSize.y / 2;
            this.camera.bottom = this.outputCamera.bottom = renderSize.y / -2;
        }
    }

    function MaskShader() {
        this.uniforms = THREE.UniformsUtils.merge([{
            "mouse": {
                type: "v2",
                value: null
            },
            "resolution": {
                type: "v2",
                value: null
            },
            "time": {
                type: "f",
                value: 0.0
            },
            "r2": {
                type: "f",
                value: null
            },
            "white": {
                type: "t",
                value: null
            },
            "black": {
                type: "t",
                value: null
            },
        }]);

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
            "uniform float r2;",
            "uniform float time;",
            "varying vec2 vUv;",

            "void main() {",
            "   vec2 q = vUv;",
            "   vec2 p = -1.0 + 2.0*q;",
            "   p.x *= resolution.x/resolution.y;",
            "   vec2 m = mouse;",
            "   m.x *= resolution.x/resolution.y;",
            "   float r = sqrt( dot((p - m), (p - m)) );",
            "   float a = atan(p.y, p.x);",
            "   vec4 white = vec4(texture2D(white, vUv).rgb, 1.0);",
            "   vec4 black = vec4(texture2D(black, vUv).rgb, 1.0);;",
            "   if(r < r2){",
            "       float f = smoothstep(r2, r2-1.0, r);",
            "       black = mix( black, white, f);",
            "   }",
            "   gl_FragColor = black;",
            "}",



        ].join("\n");
    }
}

return blackbox

})