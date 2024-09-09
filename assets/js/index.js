const camera = document.getElementById('camera')

navigator.mediaDevices.enumerateDevices().then(devices => {    
    if (Array.isArray(devices)) {
        devices.forEach(device => {
            if (device.kind === 'videoinput') {
                if (device.label.includes('')){
                    navigator.getUserMedia(
                        { video: {
                            deviceId: device.deviceId
                        }},
                        stream => camera.srcObject = stream,
                        error => console.error(error)
                    )
                }
            }
        })
    }
})