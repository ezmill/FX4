;(function (root, document, factory) {
    root.blackbox = factory()
})(this, this.document, function () {

/**
 * @param {DOMNode} el
 * @param {string} inputImage
 * @param {string} origImage
 * @param {object} cbs
 * @param {function} cbs.save
 * @param {function} cbs.info
 */
function blackbox (el, inputImage, origImage, cbs) {
    // Create the Blackbox's UI elements wrapper.
    var div = document.createElement('div')
    div.className = 'blackbox'
    var scene, camera, light, renderer, texture, fbMaterial, mask;
    var effectIndex = 0;
    var id;
    var effects = [ "warp",
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
    var audio = new Audio(), playing = false;

    init();
    function init(){
        scene = new THREE.Scene();
        // camera = new THREE.OrthographicCamera( renderSize.x / - 2, renderSize.x / 2, renderSize.y / 2, renderSize.y / - 2, -10000, 10000 );
        // camera.position.set(0,0,0);
        camera = new THREE.Camera();
        camera.position.z = 1;
        renderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true});
        renderer.setSize( renderSize.x, renderSize.y );
        renderer.setClearColor(0xffffff,1.0);
        createEffect();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );
        document.addEventListener( 'touchend', onDocumentTouchEnd, false );
        document.addEventListener( 'touchcancel', onDocumentTouchEnd, false );
        document.addEventListener( 'touchleave', onDocumentTouchEnd, false );
        document.addEventListener( 'keydown', onKeyDown, false );
        window.addEventListener("resize", onWindowResize);
        // uploadButton.addEventListener("click", upload);
        // infoButton.addEventListener("click", exitInfo);
        // exitButton.addEventListener("click", exitInfo);
        // uploadButton.addEventListener("touchstart", upload);
        // uploadButton.addEventListener("touchdown", upload);
        // infoButton.addEventListener("touchstart", exitInfo);
        // infoButton.addEventListener("touchdown", exitInfo);
        // exitButton.addEventListener("touchstart", exitInfo);
        // exitButton.addEventListener("touchdown", exitInfo);
        animate();
    }
    function createEffect(){
        shuffle(effects);
        insertRevert(effects);
        if(texture)texture.dispose();
        if(origTex)origTex.dispose();
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
        if(effect.useMask){
            mask = new Mask();
            mask.init();
            mask.update();
            alpha = new THREE.Texture(mask.outputRenderer.domElement);
            alpha.minFilter = alpha.magFilter = THREE.LinearFilter;
            alpha.needsUpdate = true;
        } else {
            alpha = null;
        }
        if(fbMaterial)fbMaterial.dispose();
        fbMaterial = new FeedbackMaterial(renderer, scene, camera, texture, effect.shaders);  
        fbMaterial.init();
        if(effect.name == "neon glow"){
            var tex = THREE.ImageUtils.loadTexture(path + "mask1.png");
            tex.minFilter = tex.magFilter = THREE.LinearFilter;
            mask.setMask(tex);
        } else if(effect.name == "rgb shift" || effect.name == "oil paint" || effect.name == "flow" || effect.name == "warp flow" || effect.name == "repos"){
            var tex = THREE.ImageUtils.loadTexture(path + "mask2.png")
            tex.minFilter = tex.magFilter = THREE.LinearFilter;
            mask.setMask(tex);
        } else if(effect.name == "warp"){
            var tex = THREE.ImageUtils.loadTexture(path + "mask3.png");
            tex.minFilter = tex.magFilter = THREE.LinearFilter;
            mask.setMask(tex);
        }  else {
            mask.setMask(false);
        }
        fbMaterial.setOriginalTex(origTex);
        img.onload = function(){
            texture.needsUpdate = true;
        }
        origImg.onload = function(){
            origTex.needsUpdate = true;
        }
        handleAudio(effect.name);
    }   
    function createNewEffect(){
        var useNewOriginal = false;
        if(effectIndex == effects.length - 1){
            effectIndex = 0;
        } else {
            effectIndex++;
        }       
        if(effects[effectIndex] == "neon glow"){
            useNewOriginal = true;
        } else if(effects[effectIndex] == "rgb shift" || effects[effectIndex] == "oil paint" || effects[effectIndex] == "flow" || effects[effectIndex] == "warp flow" || effects[effectIndex] == "repos"){
            useNewOriginal = true;
        } else if(effects[effectIndex] == "warp"){
            useNewOriginal = true;
        } else {
            useNewOriginal = false;
        }

        var blob = dataURItoBlob(renderer.domElement.toDataURL('image/jpg'));
        var file = window.URL.createObjectURL(blob);
        var img = new Image();
        img.src = file;
        img.onload = function(e) {
            texture.dispose();
            texture.image = img;            
            effect = new Effect(effects[effectIndex]);
            effect.init();
            if(effect.useMask){
                // mask = new Mask();
                // mask.init();
                // mask.update();
                mask.renderer.clear();
                mask.outputRenderer.clear();
                // alpha.dipose();
                alpha = new THREE.Texture(mask.outputRenderer.domElement);
                alpha.minFilter = alpha.magFilter = THREE.LinearFilter;
                alpha.needsUpdate = true;
            } else {
                alpha = null;
            }
            fbMaterial.dispose();
            fbMaterial = new FeedbackMaterial(renderer, scene, camera, texture, effect.shaders);            
            fbMaterial.init();
            if(effect.name == "neon glow"){
                var tex = THREE.ImageUtils.loadTexture(path + "mask1.png");
                tex.minFilter = tex.magFilter = THREE.LinearFilter;
                mask.setMask(tex);
            } else if(effect.name == "rgb shift" || effect.name == "oil paint" || effect.name == "flow" || effect.name == "warp flow" || effect.name == "repos"){
                var tex = THREE.ImageUtils.loadTexture(path + "mask2.png")
                tex.minFilter = tex.magFilter = THREE.LinearFilter;
                mask.setMask(tex);
            } else if(effect.name == "warp"){
                var tex = THREE.ImageUtils.loadTexture(path + "mask3.png");
                tex.minFilter = tex.magFilter = THREE.LinearFilter;
                mask.setMask(tex);
            }  else {
                mask.setMask(false);
            }
            if(useNewOriginal){
                fbMaterial.setOriginalTex(texture);
            } else {
                fbMaterial.setOriginalTex(origTex);                
            }
        }
        // handleAudio(effect.name);
    }
    function playAudio(src){
        audio.src = src;
        audio.load();
    }
    function handleAudio(name){
        switch(name){
            case "warp":
                playAudio("assets/audio/WARP.mp3")
                break;
            case "revert":
                playAudio("assets/audio/REVERT.mp3")
                break;      
            case "rgb shift":
                playAudio("assets/audio/RGB.mp3")
                break;
            case "oil paint":
                playAudio("assets/audio/OIL PAINT 2.mp3")
                break;  
            case "repos":
               playAudio("assets/audio/REPOSITION.mp3")
                break;  
            case "flow":
                playAudio("assets/audio/FLOW.mp3")
                break;
            case "gradient":
                playAudio("assets/audio/GRADIENT.mp3")
                break;  
            case "warp flow":
                playAudio("assets/audio/WARP FLOW.mp3")
                break;                                                                      
            case "curves":
                playAudio("assets/audio/CURVES.mp3")
                break;  
            case "neon glow":
                playAudio("assets/audio/NEON GLOW.mp3")
                break;
        }
    }
    function animate(){
        id = requestAnimationFrame(animate);
        draw();
    }
    function draw(){
        time += 0.01;
        if(mouseDown){
            r2 = 0.5;
        }
        if(effect.useMask){
            mask.update();
            alpha.needsUpdate = true;
        }
        if(playing){
            audio.play();
            audio.volume += (1.0 - audio.volume)*0.1;

        } else {
            audio.volume += (0.0 - audio.volume)*0.25;
            if(audio.volume < 0.1){
                audio.pause();
                handleAudio(effect.name);
            }
        }
        fbMaterial.setUniforms();
        fbMaterial.update();
        renderer.render(scene, camera);
        fbMaterial.getNewFrame();
        fbMaterial.swapBuffers();
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
    function onClickButton () {
        // Remove the button's event listener.
        uploadButton.removeEventListener('click', onClickButton)

        // Detach the UI wrapper and its content from the root element.
        el.removeChild(div)

        // Call the callback function, passing the new canvas content to it.
        var base64 = renderer.domElement.toDataURL('image/jpeg');

        cancelAnimationFrame(id);// Stop the animation
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
      var currentIndex = array.length, temporaryValue, randomIndex ;

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
    function insertRevert(array){
        var length = array.length;
        for(var i = 0; i < length; i++){
            if(array[i] == "revert"){
                array.splice(i, 1);
            }
        }
        for(var i = 0; i < length; i++){
            if(array[i] == "flow" || array[i] == "repos"){
                array.splice(i+1, 0, "revert");
            }
        }
        var startEffects = ["rgb shift", "neon glow", "curves", "oil paint", "warp"];
        var startEffectNum = Math.floor(Math.random()*startEffects.length); 
        var startEffect = startEffects[startEffectNum];
        console.log(startEffect);
        for(var i = 0; i < length; i++){
            if(array[i] == startEffect){
                array.splice(i, 1);
            }
        }
        array.splice(0, 0, startEffect);
        console.log(array);
    }
    function onMouseMove(event){
        mouse.x = ( event.pageX / renderSize.x ) * 2 - 1;
        mouse.y = - ( event.pageY / renderSize.y ) * 2 + 1;
        mask.mouse = new THREE.Vector2(mouse.x, mouse.y);       
    }
    function onMouseDown(){
        mouseDown = true;
        playing = true;
    }
    function onMouseUp(){
        mouseDown = false;
        playing = false;
        r2 = 0;
        createNewEffect();

    }
    function onDocumentTouchStart( event ) {
        mouseDown = true;
        updateMouse(event);
    }

    function onDocumentTouchMove( event ) {
        mouseDown = true;
        updateMouse(event);
    }

    function updateMouse(event){
        if ( event.touches.length === 1 ) {
            event.preventDefault();
            mouse.x = ( event.touches[ 0 ].pageX / renderSize.x ) * 2 - 1;
            mouse.y = - ( event.touches[ 0 ].pageY / renderSize.y ) * 2 + 1;
            mask.mouse = new THREE.Vector2(mouse.x, mouse.y);       
        }
    }
        
    function onDocumentTouchEnd( event ) {
        mouseDown = false;
        r2 = 0;
        createNewEffect();
    }
    function onWindowResize( event ) {

        if(window.innerWidth>imgEl.width*(window.innerHeight/imgEl.height)){
            renderSize = new THREE.Vector2(window.innerWidth, imgEl.height*(window.innerWidth/imgEl.width));
        } else {
            renderSize = new THREE.Vector2(imgEl.width*(window.innerHeight/imgEl.height), window.innerHeight);
        }
        renderer.setSize( renderSize.x, renderSize.y );
        // camera.left = renderSize.x / - 2;
        // camera.right = renderSize.x / 2;
        // camera.top = renderSize.y / 2;
        // camera.bottom = renderSize.y / - 2;
        mask.resize();
        fbMaterial.resize();
        fbMaterial.setUniforms();
    }
    function onKeyDown(event){
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

}

return blackbox

})
