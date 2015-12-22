;(function (root, document, factory) {
    root.blackbox = factory()
})(this, this.document, function () {

/**
 * @param {DOMNode} el Root element of the blackbox.
 * @param {string} inputImage Input image data (outputImage-encoded string).
 * @param {string} origImage Original image data (outputImage-encoded string).
 * @param {object} cbs Callback functions hash.
 * @param {funciton} cbs.save "Save" button click handler.
 * @param {funciton} cbs.info "Info" button click handler.
 */
function blackbox (el, inputImage, origImage, cbs) {
    // Create the Blackbox's UI elements wrapper.
    var div = document.createElement('div')
    div.className = 'blackbox'

    // Put a canvas to the wrapper.
    var canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    div.appendChild(canvas)

    // Put a controls container to the wrapper.
    controls = document.createElement('div')
    controls.className = 'controls'
    div.appendChild(controls)

    // Put the "Save" button to the controls container.
    var saveButton = document.createElement('button')
    saveButton.type = 'button'
    saveButton.innerHTML = 'Save'
    saveButton.addEventListener('click', onClickSave)
    controls.appendChild(saveButton)

    // Put the "Info" button to the controls container.
    var infoButton = document.createElement('button')
    infoButton.type = 'button'
    infoButton.innerHTML = 'Info'
    infoButton.addEventListener('click', onClickInfo)
    controls.appendChild(infoButton)

    // Attach the wrapper and its content to the root element.
    el.appendChild(div)

    // Render the input image data to the canvas.
    var ctx = canvas.getContext('2d')
    var image = new Image()
    image.src = inputImage
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // Apply some random filters after a short delay.
    // This should be replaced with the actual filters code.
    setTimeout(function () {
        var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
        var d = pixels.data
        var k = Math.random()
        for (var i = 0; i < d.length; i += 4) {
            d[i] = 0.32 * k * d[i] + 0.5 * k * d[i + 1] + 0.16 * k * d[i + 2]
        }
        ctx.putImageData(pixels, 0, 0)
    }, 1000)

    // This function is called on the "Save" button click.
    function onClickSave () {
        // Remove the button's event listener.
        button.removeEventListener('click', onClickSave)

        // Detach the UI wrapper and its content from the root element.
        el.removeChild(div)

        // Call the callback function, passing the new canvas content to it.
        var outputImage = canvas.toDataURL()
        cbs.save(null, outputImage, origImage)
    }

    // This function is called on the "Info" button click.
    function onClickInfo () {
        cbs.info()
    }
}

return blackbox

})
