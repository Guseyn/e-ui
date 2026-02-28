class VCTemplate extends HTMLTemplateElement {
  constructor() {
    super()
    this.ehtmlActivated = false
  }

  connectedCallback() {
    this.addEventListener(
      'ehtml:activated',
      this.#onEHTMLActivated,
      { once: true }
    )
  }

  #onEHTMLActivated() {
    if (this.ehtmlActivated) {
      return
    }
    this.ehtmlActivated = true
    initializeVCRoom(this)
  }
}

customElements.define('e-vc', VCTemplate, { extends: 'template' })

function initializeVCRoom(node) {
  const lessonLogId = node.getAttribute('data-lesson-log-id')

  let sessionId
  let lessonStartTime

  const localVideoSelector = node.getAttribute('data-local-video')
  const remoteVideoSelector = node.getAttribute('data-remote-video')
  const videoSelectorSelector = node.getAttribute('data-video-selector')
  const audioSelectorSelector = node.getAttribute('data-audio-selector')
  const audioVolumeSliderSelector = node.getAttribute('data-audio-volume-slider-selector')
  const magnifyingGlassZoomSliderSelector = node.getAttribute('data-magnifying-glass-zoom-slider-selector')
  const suppressNoiseSelector = node.getAttribute('data-suppress-noise-selector')
  const settingsButtonSelector = node.getAttribute('data-settings-button-selector')
  const settingsModalSelector = node.getAttribute('data-settings-modal-selector')
  const menuIconSelector = node.getAttribute('data-menu-icon-selector')
  const lessonMaterialsButtonSelector = node.getAttribute('data-lesson-materials-button-selector')
  const lessonMaterialsModalSelector = node.getAttribute('data-lesson-materials-modal-selector')
  const cameraFlipButtonSelector = node.getAttribute('data-camera-flip-button-selector')
  const micButtonSelector = node.getAttribute('data-mic-button-selector')
  const videoButtonSelector = node.getAttribute('data-video-button-selector')
  const muteMicSrc = node.getAttribute('data-mute-mic-src')
  const videoOffSrc = node.getAttribute('data-video-off-src')
  const handIconSelector = node.getAttribute('data-hand-icon-selector')
  const handActiveSrc = node.getAttribute('data-hand-active-src')
  const chatIconSelector = node.getAttribute('data-chat-icon-selector')
  const chatBoxSelector = node.getAttribute('data-chat-box-selector')
  const chatBoxTemplateSelector = node.getAttribute('data-chat-box-template-selector')
  const messagesBoxSelector = node.getAttribute('data-messages-box-selector')
  const shareIconSelector = node.getAttribute('data-share-icon-selector')
  const metronomeIconSelector = node.getAttribute('data-metronome-icon-selector')
  const metronomeModalSelector = node.getAttribute('data-metronome-modal-selector')
  const magnifierIconSelector = node.getAttribute('data-magnifier-icon-selector')
  const magnifyingGlassSelector = node.getAttribute('data-magnifying-glass-selector')
  const callEndIconSelector = node.getAttribute('data-call-end-icon-selector')
  const callEndModalSelector = node.getAttribute('data-call-end-modal-selector')
  const showLocalVideoIconSelector = node.getAttribute('data-show-local-video-icon-selector')

  const socketName = node.getAttribute('data-socket-name')
  const roomId = node.getAttribute('data-room-id')
  const clientId = node.getAttribute('data-client-id')

  node.parentNode.replaceChild(
    node.content.cloneNode(true),
    node
  )

  function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  function isInside(child, parent) {
    let node = child
    while (node) {
      if (node === parent) {
        return true
      }
      node = node.parentNode
    }
    return false
  }

  const localVideoComponent = document.querySelector(localVideoSelector)
  const remoteVideoComponent = document.querySelector(remoteVideoSelector)
  const videoSelector = document.querySelector(videoSelectorSelector)
  const audioSelector = document.querySelector(audioSelectorSelector)
  const audioVolumeSlider = document.querySelector(audioVolumeSliderSelector)
  const magnifyingGlassZoomSlider = document.querySelector(magnifyingGlassZoomSliderSelector)
  const suppressNoise = document.querySelector(suppressNoiseSelector)
  const settingsButton = document.querySelector(settingsButtonSelector)
  const settingsModal = document.querySelector(settingsModalSelector)
  const lessonMaterialsButton = document.querySelector(lessonMaterialsButtonSelector)
  const lessonMaterialsModal = document.querySelector(lessonMaterialsModalSelector)
  const cameraFlipButton = document.querySelector(cameraFlipButtonSelector)
  const menuIcon = document.querySelector(menuIconSelector)
  const micButton = document.querySelector(micButtonSelector)
  const handIcon = document.querySelector(handIconSelector)
  const videoButton = document.querySelector(videoButtonSelector)
  const initialMicSrc = micButton.querySelector('img').getAttribute('src')
  const initialVideoSrc = videoButton.querySelector('img').getAttribute('src')
  const initialHandSrc = handIcon.querySelector('img').getAttribute('src')
  const chatIcon = document.querySelector(chatIconSelector)
  const chatBoxTemplate = document.querySelector(chatBoxTemplateSelector)
  const shareIcon = document.querySelector(shareIconSelector)
  const metronomeIcon = document.querySelector(metronomeIconSelector)
  const metronomeModal = document.querySelector(metronomeModalSelector)
  const magnifierIcon = document.querySelector(magnifierIconSelector)
  const magnifyingGlass = document.querySelector(magnifyingGlassSelector)
  const magnifyingGlassVideo = document.querySelector(`${magnifyingGlassSelector} > video`)
  const callEndIcon = document.querySelector(callEndIconSelector)
  const callEndModal = document.querySelector(callEndModalSelector)
  const showLocalVideoIcon = document.querySelector(showLocalVideoIconSelector)

  const metronomeSoundSelect = metronomeModal.querySelector('#sound-select')
  const beatRateInput = metronomeModal.querySelector('#beat-rate')
  const nbpmSelect = metronomeModal.querySelector('#nbpm')
  const metronomeVolumeSlider = metronomeModal.querySelector('#metronome-volume-slider')

  let chatBox
  let messagesBox
  let attatchFileInputField
  function setUpChatBox() {
    chatIcon.style.display = ''
    chatBox = document.querySelector(chatBoxSelector)
    messagesBox = document.querySelector(messagesBoxSelector)
    attatchFileInputField = chatBox.querySelector('[name="attachments"]')
    const maxSizeInMb = attatchFileInputField.getAttribute('data-max-size-in-mb') * 1
    const accept = attatchFileInputField.getAttribute('accept')
    attatchFileInputField.addEventListener('change', (e) => {
      if (attatchFileInputField.hasAttribute('multiple')) {
        const files = [...e.target.files]
        if (attatchFileInputField.hasAttribute('data-max-number-of-files')) {
          if (files.length > (attatchFileInputField.getAttribute('data-max-number-of-files') * 1)) {
            showErrorToast(`Max number of files is ${attatchFileInputField.getAttribute('data-max-number-of-files')}`)
            return
          }
        }
        files.forEach((file, index) => {
          laodFile(file, accept, maxSizeInMb, index)
        })
      } else {
        const file = e.target.files[0]
        laodFile(file, accept, maxSizeInMb, 0)
      }
    })
  }

  function laodFile(file, accept, maxSizeInMb, index) {
    if (!file) return

    if (!accept.split(', ').includes(file.type)) {
      showErrorToast(`Only ${accept} are allowed.`)
      return
    }

    const maxSize = maxSizeInMb * 1024 * 1024
    if (file.size > maxSize) {
      showErrorToast(`File too large. Max ${maxSizeInMb}MB.`)
      return
    }

    const messageInput = attatchFileInputField.closest('form').querySelector('input[type="text"]')
    if (index === 0) {
      messageInput.value = 'Upload: ' + file.name
    } else {
      messageInput.value += (', ' + file.name)
    }
  }

  let isLocalVideoFlipped = false
  let isMicMute = false
  let isVideoOff = false
  let isHandActive = false
  let localVideoIsSmall = true
  let isMagnifyingGlassActive = false

  const remoteUserDetails = {}
  const localUserDetails = {}

  let isRoomFull = false

  const ws = window.__EHTML_WEB_SOCKETS__[socketName]

  const mediaConstraints = {
    audio:  {
      echoCancellation: true,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 2 },
      sampleRate: { ideal: 48_000 },
      sampleSize: { ideal: 16 }
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  }

  let localStream = null
  let remoteStream = null
  let rtcPeerConnection = null
  let pendingCandidates = []

  let metronomeAudioCtx = null
  let metronomeReservedDestination = null
  let reservedMetronomeTrack = null
  let metronomeLocalGainNode = null
  let localMicGainNode = null
  let metronomeIsHost = false
  let metronomeCurrentHostId = null

  const soundMapForMetronome = {
    'bass': {},
    'celesta': {},
    'glockenspiel': {},
    'marimba': {},
    'melodic-tom': {},
    'steel-drum': {},
    'synth-drum': {},
    'taiko-drum': {},
    'xylophone': {}
  }

  let isMetronomeActive = false
  let metronomeIntervalId = null
  let metronomePulseIntervalId = null
  let metronomePulseEl = null

  let remoteDescriptionSet = {
    value: false
  }
  let isInitiator = {
    value: false
  }

  window.addEventListener('beforeunload', async () => {
    if (rtcPeerConnection) {
      rtcPeerConnection.close()
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop())
    }

    await fetch(`/lesson-logs/${lessonLogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        duration: (lessonStartTime && isInitiator.value)
          ? (Date.now() - lessonStartTime)
          : 0
      })
    })

    ws.close()
    window.__EHTML_WEB_SOCKETS__[socketName] = null
  })

  const iceServers = window[node.getAttribute('data-ice-servers-variable-name')]
  if (!iceServers) {
    console.log('ICE Servers are not defined in attribute "data-ice-servers-variable-name"')
  }

  ws.addEventListener('message', handleMessage)

  function formatDuration(seconds) {
    seconds = Math.floor(seconds)

    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hrs > 0) {
      parts.push(`${hrs}h`)
    }
    if (mins > 0) {
      parts.push(`${mins}m`)
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}s`)
    }

    return parts.join(' ')
  }

  const eventHandlers = {
    ping: async (roomId, client) => {
      ws.send(JSON.stringify({
        event: 'pong'
      }))
    },
    userConnectedAndAuthenticated: async (wsObj) => {
      const videoDeviceId = videoSelector.value
      const audioDeviceId = audioSelector.value
      await setLocalStream(mediaConstraints, videoDeviceId, audioDeviceId)
      ws.send(
        JSON.stringify({
          event: 'userJoined',
          roomId
        })
      )
    },
    userJoined: async (wsObj) => {
      if (wsObj.userId !== clientId && wsObj.payload.isUserRejoining) {
        isInitiator.value = false
      } else if (wsObj.userId === clientId && wsObj.payload.isClientInitiator) {
        isInitiator.value = true
      }
      const allClients = wsObj.payload.allClients

      if (isMetronomeActive) {
        await stopMetronome()
        await stopMetronomePulse()
      }

      if (wsObj.userId === clientId) {
        const localClient = allClients.find(client => client.id === clientId)
        localUserDetails.id = localClient.id
        localUserDetails.email = localClient.email
        localUserDetails.firstName = localClient.firstName
        localUserDetails.lastName = localClient.lastName
        mapToTemplate(chatBoxTemplate, localUserDetails)
        queueMicrotask(() => {
          settingsModal.showModal()
          setUpChatBox()
        })
      }

      allClients.forEach((client) => {
        if (clientId === client.id) {
          localUserDetails.id = client.id
          localUserDetails.email = client.email
          localUserDetails.firstName = client.firstName
          localUserDetails.lastName = client.lastName
          localVideoComponent.parentNode.querySelector('label').innerText = (localUserDetails.firstName && localUserDetails.lastName)
            ? `${localUserDetails.firstName} ${localUserDetails.lastName}` : localUserDetails.email
        } else {
          remoteUserDetails.id = client.id
          remoteUserDetails.email = client.email
          remoteUserDetails.firstName = client.firstName
          remoteUserDetails.lastName = client.lastName

          remoteVideoComponent.parentNode.querySelector('label').innerText = (remoteUserDetails.firstName && remoteUserDetails.lastName)
            ? `${remoteUserDetails.firstName} ${remoteUserDetails.lastName}`
            : remoteUserDetails.email

          if (client.isVideoOff) {
            remoteVideoComponent.parentNode.querySelector('img[is="video-placeholder"]').style.display = 'block'
          } else {
            remoteVideoComponent.parentNode.querySelector('img[is="video-placeholder"]').style.display = 'none'
          }

          remoteVideoComponent.parentNode.querySelector('img[is="mic-icon"]').style['display'] = 'inline-block'
          if (client.isMicMute) {
            remoteVideoComponent.parentNode.querySelector('img[is="mic-icon"]').setAttribute('src', muteMicSrc)
          } else {
            remoteVideoComponent.parentNode.querySelector('img[is="mic-icon"]').setAttribute('src', initialMicSrc)
          }

          if (client.isHandActive) {
            remoteVideoComponent.parentNode.querySelector('img[is="hand-gesture"]').style.display = ''
          } else {
            remoteVideoComponent.parentNode.querySelector('img[is="hand-gesture"]').style.display = 'none'
          }
        }
      })

      if (isInitiator.value && wsObj.payload.isRoomFull) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks()
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        const offer = await rtcPeerConnection.createOffer()
        rtcPeerConnection.setLocalDescription(offer)
        ws.send(
          JSON.stringify({
            event: 'webrtcOffer',
            roomId,
            payload: {
              sdp: offer
            }
          })
        )
      }
      if (wsObj.payload.isRoomFull) {
        isRoomFull = true
        lessonStartTime = Date.now()
      }
      if (wsObj.userId === clientId) {
        ws.send(
          JSON.stringify({
            event: 'chats',
            roomId
          })
        )
      }
    },
    userLeft: async (wsObj) => {
      if (wsObj.userId !== clientId) {
        remoteVideoComponent.srcObject = null
        remoteStream = null
        remoteVideoComponent.parentNode.querySelector('label').innerText = 'User Disconnected'
        isRoomFull = false
      }
      if (rtcPeerConnection) {
        rtcPeerConnection.close()
      }
    },
    error: async (wsObj) => {
      showErrorToast(wsObj.message)
    },
    webrtcOffer: async (wsObj) => {
      if (!isInitiator.value) {
        if (rtcPeerConnection) {
          rtcPeerConnection.close()
        }

        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks()
        rtcPeerConnection.ontrack = setRemoteStream
        await rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(wsObj.payload.sdp)
        )
        remoteDescriptionSet.value = true
        rtcPeerConnection.onicecandidate = sendIceCandidate
        
        for (const candidate of pendingCandidates) {
          try {
            await rtcPeerConnection.addIceCandidate(candidate)
          } catch (err) {
            console.error('Error adding queued ICE candidate:', err)
          }
        }
        pendingCandidates = []
        
        const answer = await rtcPeerConnection.createAnswer()
        rtcPeerConnection.setLocalDescription(answer)

        ws.send(JSON.stringify({
          event: 'webrtcAnswer',
          roomId,
          payload: {
            sdp: answer,
          }
        }))
      }
    },
    webrtcAnswer: async (wsObj) => {
      await rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(wsObj.payload.sdp)
      )
      remoteDescriptionSet.value = true

      if (isMetronomeActive) {
        startMetronome()
      }

      for (const candidate of pendingCandidates) {
        try {
          await rtcPeerConnection.addIceCandidate(candidate)
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err)
        }
      }
      pendingCandidates = []
    },
    webrtcIceCandidate: async (wsObj) => {
      const candidate = new RTCIceCandidate({
        sdpMLineIndex: wsObj.payload.label,
        candidate: wsObj.payload.candidate,
      })
      if (remoteDescriptionSet.value && rtcPeerConnection) {
        try {
          await rtcPeerConnection.addIceCandidate(candidate)
        } catch (err) {
          console.error('Error adding ICE candidate:', err)
        }
      } else {
        pendingCandidates.push(candidate)
      }
    },
    videoOnAndOff: async (wsObj) => {
      if (wsObj.userId !== clientId) {
        if (wsObj.payload.isVideoOff) {
          remoteVideoComponent.parentNode.querySelector('img[is="video-placeholder"]').style.display = 'block'
        } else {
          remoteVideoComponent.parentNode.querySelector('img[is="video-placeholder"]').style.display = 'none'
        }
      }
    },
    audioOnAndOff: async (wsObj) => {
      if (wsObj.userId !== clientId) {
        if (wsObj.payload.isMicMute) {
          remoteVideoComponent.parentNode.querySelector('img[is="mic-icon"]').setAttribute('src', muteMicSrc)
        } else {
          remoteVideoComponent.parentNode.querySelector('img[is="mic-icon"]').setAttribute('src', initialMicSrc)
        }
      }
    },
    handAction: async (wsObj) => {
      if (wsObj.userId !== clientId) {
        if (wsObj.payload.isHandActive) {
          playNotificationSound()
          remoteVideoComponent.parentNode.querySelector('img[is="hand-gesture"]').style.display = ''
        } else {
          remoteVideoComponent.parentNode.querySelector('img[is="hand-gesture"]').style.display = 'none'
        }
      }
    },
    userStartedMetronome: async (wsObj) => {
      if (wsObj.userId !== clientId) {
        const {
          sound,
          bpm,
          nbpm,
          startTime
        } = wsObj.payload
        metronomeStartDelay = (startTime - Date.now()) / 1000
        metronomeSoundSelect.value = sound
        beatRateInput.value = bpm
        nbpmSelect.value = nbpm
        if (!isMicMute) {
          micButton.click()
        }
      } else {
        await startMetronome()
      }
      if (isMetronomeActive) {
        await stopMetronomePulse()
      }
      await startMetronomePulse()
    },
    userStoppedMetronome: async (wsObj) => {
      if (isMetronomeActive) {
        await stopMetronomePulse()
      }
      if (wsObj.userId !== clientId) {
        if (isMicMute) {
          micButton.click()
        }
      }
    },
    unknown: () => {
      return
      // alert('unknown event from ws')
    }
  }

  async function handleMessage({ data }) {
    const wsObj = JSON.parse(data)
    const eventHandler = eventHandlers[wsObj.event] || eventHandlers['unknown']
    await eventHandler(wsObj)
  }

  async function setLocalStream(constraints, videoDeviceId, audioDeviceId) {
    try {
      if (!localStream) {
        localStream = new MediaStream()
      }

      const updated = {
        ...constraints,
        video: videoDeviceId
          ? { ...constraints.video, deviceId: { exact: videoDeviceId } }
          : constraints.video,
        audio: audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : constraints.audio
      }

      const baseStream = await navigator.mediaDevices.getUserMedia(updated)

      const audioTracks = baseStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !isMicMute
      })

      const videoTracks = baseStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !isVideoOff
      })

      const newVideoTrack = baseStream.getVideoTracks()[0]
      const newAudioTrack = baseStream.getAudioTracks()[0]

      newVideoTrack._deviceId = videoDeviceId || null
      newAudioTrack._deviceId = audioDeviceId || null

      const oldVideoTrack = localStream.getVideoTracks()[0]
      const oldAudioTrack = localStream.getAudioTracks()[0]

      if (oldVideoTrack) {
        if (!newVideoTrack || (newVideoTrack && oldVideoTrack._deviceId !== newVideoTrack._deviceId)) {
          localStream.removeTrack(oldVideoTrack)
          oldVideoTrack.stop()
        }
      }
      if (newVideoTrack) {
        if (!oldVideoTrack || (oldVideoTrack && oldVideoTrack._deviceId !== newAudioTrack._deviceId)) {
          localStream.addTrack(newVideoTrack)
        }
      }

      if (oldAudioTrack) {
        if (!newAudioTrack || (newAudioTrack && oldAudioTrack._deviceId !== newAudioTrack._deviceId)) {
          localStream.removeTrack(oldAudioTrack)
          oldAudioTrack.stop()
        }
      }
      if (newAudioTrack) {
        if (!oldAudioTrack || (oldAudioTrack && oldAudioTrack._deviceId !== newAudioTrack._deviceId)) {
          localStream.addTrack(newAudioTrack)
        }
      }

      if (!localVideoComponent.srcObject) {
        localVideoComponent.srcObject = localStream
      }

      if (!metronomeAudioCtx) {
        metronomeAudioCtx = new AudioContext({ sampleRate: 48_000 })
      }
      if (!metronomeReservedDestination) {
        metronomeReservedDestination = metronomeAudioCtx.createMediaStreamDestination()
        reservedMetronomeTrack = metronomeReservedDestination.stream.getAudioTracks()[0]
      }
      initMetronomeNodes()
      await loadSoundMapForMetronome(soundMapForMetronome)

    } catch (err) {
      console.error('Error getting media', err)
    }
  }

  async function updateMediaDevices(videoDeviceId, audioDeviceId) {
    await setLocalStream(mediaConstraints, videoDeviceId, audioDeviceId)
    if (rtcPeerConnection) {
      const videoTrack = localStream.getVideoTracks()[0]
      const audioTrack = localStream.getAudioTracks()[0]

      const videoSender = rtcPeerConnection.getSenders().find(s => s.track.kind === 'video')
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack)
      }

      const audioSender = rtcPeerConnection.getSenders().find(s => s.track.kind === 'audio')
      if (audioSender && audioTrack) {
        audioSender.replaceTrack(audioTrack)
      }
    }
  }

  function addLocalTracks() {
    localStream.getTracks().forEach(track => {
      rtcPeerConnection.addTrack(track, localStream)
    })
    if (reservedMetronomeTrack) {
      rtcPeerConnection.addTrack(
        reservedMetronomeTrack,
        localStream
      )
    }
  }

  function sendIceCandidate(event) {
    if (event.candidate) {
      ws.send(JSON.stringify({
        event: 'webrtcIceCandidate',
        roomId,
        payload: {
          label: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate
        }
      }))
    }
  }

  function setRemoteStream(event) {
    remoteStream = event.streams[0]
    remoteVideoComponent.srcObject = remoteStream
    magnifyingGlassVideo.srcObject = remoteStream
  }

  function setupSwap() {
    function swapVideos(event) {
      const videoComponentType = event.target.parentNode.getAttribute('data-type')
      if (localVideoIsSmall && videoComponentType === 'remote') {
        return
      }
      if (!localVideoIsSmall && videoComponentType === 'local') {
        return
      }
      localVideoIsSmall = !localVideoIsSmall
      if (localVideoIsSmall) {
        document.body.insertBefore(
          remoteVideoComponent.parentNode,
          localVideoComponent.parentNode
        )
        magnifyingGlassVideo.srcObject = remoteVideoComponent.srcObject
      } else {
        document.body.insertBefore(
          localVideoComponent.parentNode,
          remoteVideoComponent.parentNode
        )
        magnifyingGlassVideo.srcObject = localVideoComponent.srcObject
      }
    }

    remoteVideoComponent.addEventListener('click', swapVideos, 'remote')
    localVideoComponent.addEventListener('click', swapVideos, 'local')
  }

  async function populateVideoAndAudioSelectors() {
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoSelector.innerHTML = ''
    audioSelector.innerHTML = ''
    const videoDevices = devices.filter(d => d.kind === 'videoinput')
    const audioDevices = devices.filter(d => d.kind === 'audioinput')
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.text = device.label || `Camera ${index + 1}`
      videoSelector.appendChild(option)
    })
    audioDevices.forEach((device, index) => {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.text = device.label || `Mic ${index + 1}`
      audioSelector.appendChild(option)
    })
  }

  videoSelector.addEventListener('change', async () => {
    const videoDeviceId = videoSelector.value
    const audioDeviceId = audioSelector.value
    await updateMediaDevices(videoDeviceId, audioDeviceId)
  })

  audioSelector.addEventListener('change', async () => {
    const videoDeviceId = videoSelector.value
    const audioDeviceId = audioSelector.value
    await updateMediaDevices(videoDeviceId, audioDeviceId)
  })

  settingsButton.addEventListener('click', () => {
    settingsModal.showModal()
  })

  cameraFlipButton.addEventListener('change', () => {
    isLocalVideoFlipped = !isLocalVideoFlipped
    if (isLocalVideoFlipped) {
      localVideoComponent.style.transform = 'scaleX(-1)'
    } else {
      localVideoComponent.style.transform = 'scaleX(+1)'
    }
  })

  if (micButton) {
    micButton.addEventListener('click', () => {
      isMicMute = !isMicMute
      const micImg = micButton.querySelector('img')

      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !isMicMute
      })

      micImg.setAttribute('src', isMicMute ? muteMicSrc : initialMicSrc)
      localVideoComponent.parentNode
        .querySelector('img[is="mic-icon"]')
        .setAttribute('src', isMicMute ? muteMicSrc : initialMicSrc)

      ws.send(JSON.stringify({
        event: 'audioOnAndOff',
        roomId,
        userId: clientId,
        payload: { isMicMute }
      }))
    })
  }

  if (menuIcon) {
    let menuOpen = false
    menuIcon.addEventListener('click', () => {
      if (!menuOpen) {
        menuIcon.querySelector('img').src = '/images/close-light.svg'
        menuIcon.setAttribute('data-open', 'true')
        menuOpen = true
        micButton.style.display = 'none'
        callEndIcon.style.display = 'none'
        videoButton.style.display = 'none'
        handIcon.style.display = 'inline-block'
        chatIcon.style.display = 'inline-block'
        lessonMaterialsButton.style.display = 'inline-block'
        metronomeIcon.style.display = 'inline-block'
      } else {
        menuIcon.querySelector('img').src = '/images/menu-light.svg'
        menuIcon.removeAttribute('data-open')
        menuOpen = false
        micButton.style.display = 'inline-block'
        callEndIcon.style.display = 'inline-block'
        videoButton.style.display = 'inline-block'
        handIcon.style.display = 'none'
        chatIcon.style.display = 'none'
        lessonMaterialsButton.style.display = 'none'
        metronomeIcon.style.display = 'none'
      }
    })
  }

  const notificationSoundUrl = '/wav/lesson-room-notification.wav'
  let notificationSoundAudioCtx = null
  let notificationSoundBuffer = null


  async function loadNotificationSound() {
    if (!notificationSoundAudioCtx) {
      notificationSoundAudioCtx = new AudioContext({ sampleRate: 48_000 })
    }
    const resp = await fetch('/wav/lesson-room-notification.wav')
    const arrayBuffer = await resp.arrayBuffer()
    return await notificationSoundAudioCtx.decodeAudioData(arrayBuffer)
  }

  function playNotificationSound() {
    if (!notificationSoundAudioCtx) return
    if (notificationSoundAudioCtx.state === 'suspended') {
      notificationSoundAudioCtx.resume()
    }
    if (!notificationSoundBuffer) return

    const source = notificationSoundAudioCtx.createBufferSource()
    source.buffer = notificationSoundBuffer
    source.connect(notificationSoundAudioCtx.destination)
    source.start()
  }

  window.playNotificationSound = playNotificationSound

  handIcon.addEventListener('click', () => {
    isHandActive = !isHandActive
    if (isHandActive) {
      playNotificationSound()
    }
    const handImg = handIcon.querySelector('img')
    handImg.setAttribute('src', isHandActive ? handActiveSrc : initialHandSrc)
    localVideoComponent.parentNode
      .querySelector('img[is="hand-gesture"]')
      .style.display = isHandActive ? '' : 'none'

    ws.send(JSON.stringify({
      event: 'handAction',
      roomId,
      userId: clientId,
      payload: { isHandActive }
    }))
  })

  videoButton.addEventListener('click', () => {
    isVideoOff = !isVideoOff
    const videoImg = videoButton.querySelector('img')

    const videoTracks = localStream.getVideoTracks()
    videoTracks.forEach(track => {
      track.enabled = !isVideoOff
    })

    videoImg.setAttribute('src', isVideoOff ? videoOffSrc : initialVideoSrc)
    localVideoComponent.parentNode
      .querySelector('img[is="video-placeholder"]')
      .style.display = isVideoOff ? 'block' : 'none'

    ws.send(JSON.stringify({
      event: 'videoOnAndOff',
      roomId,
      userId: clientId,
      payload: { isVideoOff }
    }))
  })

  lessonMaterialsButton.addEventListener('click', () => {
    lessonMaterialsModal.showModal()
  })

  let isChatOpen = false
  let chatNeverOpenedBefore = true

  chatIcon.addEventListener('click', (event) => {
    event.currentTarget.classList.remove('highlight-alert')
    isChatOpen = !isChatOpen
    if (isChatOpen) {
      chatBox.style.display = 'block'
      if (chatNeverOpenedBefore) {
        chatNeverOpenedBefore = false
        messagesBox.scrollTop = messagesBox.scrollHeight
      }
    } else {
      chatBox.style.display = 'none'
    }
  })

  window.removeMessageFromChat = (event) => {
    const target = event.target
    const messageIndex = target.getAttribute('data-message-index')
    hideElms(target.parentNode)
    ws.send(JSON.stringify({
      event: 'removeChatMessage',
      roomId,
      payload: {
        messageIndex
      }
    }))
  }

  function createTextVideoTrack(text = 'You are sharing your screen') {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')

    // Draw background
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Prepare text lines
    const lines = text.split('\n')
    const fontSize = 50
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.fillStyle = '#f9f9f9'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Calculate total height and line spacing
    const lineHeight = fontSize * 1.4
    const totalTextHeight = lineHeight * lines.length
    let startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2

    // Draw each line centered
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight
      ctx.fillText(line, canvas.width / 2, y)
    })

    // Convert to stream
    const stream = canvas.captureStream(1) // 1 FPS for static image
    return stream.getVideoTracks()[0]
  }

  async function startScreenShareWithMic() {
    try {
      // Save current selected device IDs to restore later
      const videoDeviceId = videoSelector.value || null
      const audioDeviceId = audioSelector.value || null

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: false // ✅ avoid OverconstrainedError on Sidecar/iPad
      })

      const screenTrack = screenStream.getVideoTracks()[0]

      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop()
          localStream.removeTrack(track)
        })
      }

      screenStream.getVideoTracks().forEach(track => {
        track._deviceId = null
        localStream.addTrack(track)
      })

      const placeholderTrack = createTextVideoTrack('You’re sharing your screen.\n We’ve hidden the preview \n to prevent an infinite mirror effect.')
      const placeholderStream = new MediaStream([placeholderTrack])
      localVideoComponent.srcObject = placeholderStream

      if (rtcPeerConnection) {
        const videoSender = rtcPeerConnection.getSenders().find(s => s.track && s.track.kind === 'video')
        if (videoSender) {
          await videoSender.replaceTrack(screenStream.getVideoTracks()[0])
        }
      }

      hideElms(shareIcon)

      screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
        console.log('Screen sharing stopped, reverting to camera + mic')

        localStream.getVideoTracks().forEach(track => {
          track.stop()
          localStream.removeTrack(track)
        })

        await updateMediaDevices(videoDeviceId, audioDeviceId)
        localVideoComponent.srcObject = localStream
        showElms(shareIcon)
      })

    } catch (err) {
      showElms(shareIcon)
      console.warn('Screen sharing with mic failed or cancelled:', err)
    }
  }

  shareIcon.addEventListener('click', async () => {
    await startScreenShareWithMic()
  })

  metronomeIcon.addEventListener('click', () => {
    metronomeModal.showModal()
  })

  const defaulMetronomeStartDelay = 1
  let metronomeStartDelay = defaulMetronomeStartDelay

  const metronomeStartButton = metronomeModal.querySelector('button')

  function initMetronomeNodes() {
    if (!metronomeAudioCtx) {
      return
    }
    metronomeLocalGainNode = metronomeAudioCtx.createGain()
    metronomeLocalGainNode.gain.value = metronomeVolumeSlider.value
    metronomeLocalGainNode.connect(metronomeAudioCtx.destination)
  }

  async function loadSoundMapForMetronome(soundMapForMetronome) {
    soundMapForMetronome['bass'].first = await loadSound('/wav/bass-strong.wav')
    soundMapForMetronome['bass'].other = await loadSound('/wav/bass-weak.wav')

    soundMapForMetronome['celesta'].first = await loadSound('/wav/celesta-strong.wav')
    soundMapForMetronome['celesta'].other = await loadSound('/wav/celesta-weak.wav')

    soundMapForMetronome['glockenspiel'].first = await loadSound('/wav/glockenspiel-strong.wav')
    soundMapForMetronome['glockenspiel'].other = await loadSound('/wav/glockenspiel-weak.wav')

    soundMapForMetronome['marimba'].first = await loadSound('/wav/marimba-strong.wav')
    soundMapForMetronome['marimba'].other = await loadSound('/wav/marimba-weak.wav')

    soundMapForMetronome['melodic-tom'].first = await loadSound('/wav/melodic-tom-strong.wav')
    soundMapForMetronome['melodic-tom'].other = await loadSound('/wav/melodic-tom-weak.wav')

    soundMapForMetronome['steel-drum'].first = await loadSound('/wav/steel-drum-strong.wav')
    soundMapForMetronome['steel-drum'].other = await loadSound('/wav/steel-drum-weak.wav')

    soundMapForMetronome['synth-drum'].first = await loadSound('/wav/synth-drum-strong.wav')
    soundMapForMetronome['synth-drum'].other = await loadSound('/wav/synth-drum-weak.wav')

    soundMapForMetronome['taiko-drum'].first = await loadSound('/wav/taiko-drum-strong.wav')
    soundMapForMetronome['taiko-drum'].other = await loadSound('/wav/taiko-drum-weak.wav')

    soundMapForMetronome['xylophone'].first = await loadSound('/wav/xylophone-strong.wav')
    soundMapForMetronome['xylophone'].other = await loadSound('/wav/xylophone-weak.wav')

    console.log('✅ All metronome sound files have been preloaded into cache')
  }

  function metronomePlayBuffer(buffer) {
    const source = metronomeAudioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(metronomeLocalGainNode)
    source.start()
  }

  metronomeStartButton.addEventListener('click', async () => {
    if (!isMetronomeActive) {
      metronomeIsHost = true
      metronomeCurrentHostId = clientId
      ws.send(JSON.stringify({
        event: 'userStartedMetronome',
        roomId,
        payload: {
          sound: metronomeSoundSelect.value,
          bpm: beatRateInput.value,
          nbpm: nbpmSelect.value,
          startTime: (Date.now() + metronomeStartDelay * 1000)
        }
      }))
      isMetronomeActive = true
      metronomeStartButton.innerText = 'Starts in a second...'
      return
    }
    if (metronomeIsHost) {
      metronomeIsHost = false
      ws.send(JSON.stringify({
        event: 'userStoppedMetronome',
        roomId,
        payload: {}
      }))
      await stopMetronome()
      await stopMetronomePulse()
    }
  })

  async function loadSound(url) {
    const resp = await fetch(url)
    const arrayBuffer = await resp.arrayBuffer()
    return await metronomeAudioCtx.decodeAudioData(arrayBuffer)
  }

  async function startMetronome() {
    const bpm = beatRateInput.value * 1
    const beatsPerMeasure = nbpmSelect.value * 1
    const secondsPerBeat = 60 / bpm
    const metronomeVolume = metronomeVolumeSlider.value
    let metronomeBeatCounter = 0

    const firstBeatAudio = soundMapForMetronome[metronomeSoundSelect.value].first
    const otherBeatAudio = soundMapForMetronome[metronomeSoundSelect.value].other

    const startMoment = Date.now()

    metronomeIntervalId = setInterval(() => {
      const elapsed = (Date.now() - startMoment) / 1000
      if (elapsed < metronomeStartDelay) {
        return
      }

      metronomeStartButton.innerText = 'Stop Metronome'
      if (metronomeBeatCounter % beatsPerMeasure === 0) {
        metronomePlayBuffer(firstBeatAudio)
      } else {
        metronomePlayBuffer(otherBeatAudio)
      }
      metronomeBeatCounter++
    }, secondsPerBeat * 1000)
  }

  async function stopMetronome() {
    isMetronomeActive = false
    metronomeStartButton.innerText = 'Start Metronome'
    if (metronomeIntervalId) {
      clearInterval(metronomeIntervalId)
      metronomeIntervalId = null
    }
  }

  async function startMetronomePulse() {
    isMetronomeActive = true

    let pulseEl = document.getElementById('metronome-pulse-indicator')
    if (!pulseEl) {
      pulseEl = document.createElement('div')
      pulseEl.id = 'metronome-pulse-indicator'
      document.body.appendChild(pulseEl)
    }
    pulseEl.style.display = 'block'

    const bpm = beatRateInput.value * 1
    const beatsPerMeasure = nbpmSelect.value * 1
    const secondsPerBeat = 60 / bpm
    const metronomeVolume = metronomeVolumeSlider.value
    let metronomeBeatCounter = 0

    const startMoment = Date.now()

    metronomePulseIntervalId = setInterval(() => {
      const elapsed = (Date.now() - startMoment) / 1000
      if (elapsed < metronomeStartDelay) {
        return
      }
      pulseEl.classList.remove('active', 'strong', 'weak')
      if (metronomeBeatCounter % beatsPerMeasure === 0) {
        pulseEl.classList.add('strong')
      } else {
        pulseEl.classList.add('weak')
      }
      requestAnimationFrame(() => {
        pulseEl.classList.add('active')
      })
      setTimeout(() => {
        pulseEl.classList.remove('active')
      }, 120)
      metronomeBeatCounter++
    }, secondsPerBeat * 1000)
  }

  function stopMetronomePulse() {
    isMetronomeActive = false
    if (metronomePulseIntervalId) {
      clearInterval(metronomePulseIntervalId)
      metronomePulseIntervalId = null
    }
    const pulseEl = document.getElementById('metronome-pulse-indicator')
    if (pulseEl) {
      pulseEl.classList.remove('active', 'strong', 'weak')
      pulseEl.style.display = 'none'
    }
  }

  metronomeSoundSelect.addEventListener('change', async () => {
    if (metronomeIsHost && isMetronomeActive) {
      metronomeIsHost = false
      ws.send(JSON.stringify({
        event: 'userStoppedMetronome',
        roomId,
        payload: {}
      }))
      await stopMetronome()
      await stopMetronomePulse()
    }
  })

  beatRateInput.addEventListener('input', async () => {
    if (metronomeIsHost && isMetronomeActive) {
      metronomeIsHost = false
      ws.send(JSON.stringify({
        event: 'userStoppedMetronome',
        roomId,
        payload: {}
      }))
      await stopMetronome()
      await stopMetronomePulse()
    }
  })

  nbpmSelect.addEventListener('change', async () => {
    if (metronomeIsHost && isMetronomeActive) {
      metronomeIsHost = false
      ws.send(JSON.stringify({
        event: 'userStoppedMetronome',
        roomId,
        payload: {}
      }))
      await stopMetronome()
      await stopMetronomePulse()
    }
  })

  audioVolumeSlider.addEventListener('input', (e) => {
    if (localMicGainNode) {
      localMicGainNode.gain.value = parseFloat(e.target.value)
    }
  })

  if (suppressNoise) {
    suppressNoise.addEventListener('change', async (e) => {
      mediaConstraints.audio.noiseSuppression = e.target.checked
      const videoTrack = localStream.getVideoTracks()[0]
      const audioTrack = localStream.getAudioTracks()[0]
      const videoDeviceId = videoTrack._deviceId
      const audioDeviceId = audioTrack._deviceId
      await updateMediaDevices(videoDeviceId, audioDeviceId)
    })
  }

  metronomeVolumeSlider.addEventListener('input', (e) => {
    if (metronomeLocalGainNode) {
      metronomeLocalGainNode.gain.value = e.target.value
    }
  })

  magnifyingGlassZoomSlider.addEventListener('input', (e) => {
    magnifyingGlassZoom = parseFloat(e.target.value)
  })

  callEndIcon.addEventListener('click', async () => {
    ws.close()
    remoteVideoComponent.srcObject = null
    remoteStream = null
    if (isMetronomeActive && metronomeIsHost) {
      stopMetronome()
    }
    if (rtcPeerConnection) {
      rtcPeerConnection.close()
    }

    remoteVideoComponent.parentNode.querySelector('label').innerText = 'Call Ended'
    callEndModal.showModal()
    await fetch(`/lesson-logs/${lessonLogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        duration: (lessonStartTime && isInitiator.value)
          ? (Date.now() - lessonStartTime)
          : 0
      })
    })
  })

  let magnifyingGlassZoom = 1.6
  let magnifyingGlassVideoSize = Math.min(document.body.offsetWidth, document.body.offsetHeight)

  magnifyingGlassVideo.style.width = document.body.offsetWidth + 'px'
  magnifyingGlassVideo.style.height = document.body.offsetHeight + 'px'

  magnifierIcon.addEventListener('click', () => {
    isMagnifyingGlassActive = !isMagnifyingGlassActive
    if (isMagnifyingGlassActive) {
      magnifyingGlass.style.display = 'block'

      const magnifierRect = magnifyingGlass.getBoundingClientRect()
      const left = document.body.offsetWidth - magnifierRect.width
      const top = document.body.offsetHeight - magnifierRect.height

      magnifyingGlass.style.left = left + 'px'
      magnifyingGlass.style.top = top + 'px'

      const centerX = left + magnifierRect.width / 2
      const centerY = top + magnifierRect.height / 2

      magnifyingGlassVideo.style.transformOrigin = `0 0`

      const translateX = centerX - centerX * magnifyingGlassZoom
      const translateY = centerY - centerY * magnifyingGlassZoom

      magnifyingGlassVideo.style.transform = `translate(-${translateX}px, -${translateY}px) scale(${magnifyingGlassZoom})`
    } else {
      magnifyingGlass.style.display = 'none'
      magnifyingGlassVideo.style.transform = ''
    }
  })

  window.addEventListener('resize', () => {
    magnifyingGlassVideoSize = Math.min(document.body.offsetWidth, document.body.offsetHeight)
    magnifyingGlassVideo.style.width = document.body.offsetWidth + 'px'
    magnifyingGlassVideo.style.height = document.body.offsetHeight + 'px'
  })

  document.body.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX
    const mouseY = e.clientY

    const halfWidth = magnifyingGlass.offsetWidth / 2
    const halfHeight = magnifyingGlass.offsetHeight / 2
    const left = Math.max(0, Math.min(mouseX - halfWidth, document.body.offsetWidth - magnifyingGlass.offsetWidth))
    const top = Math.max(0, Math.min(mouseY - halfHeight, document.body.offsetHeight - magnifyingGlass.offsetHeight))

    magnifyingGlass.style.left = left + 'px'
    magnifyingGlass.style.top = top + 'px'

    magnifyingGlassVideo.style.transformOrigin = `${magnifyingGlass.style.left} ${magnifyingGlass.style.top}`

    let translateX = left + halfWidth
    let translateY = top + halfHeight

    magnifyingGlassVideo.style.transform = `translate(-${translateX}px, -${translateY}px) scale(${magnifyingGlassZoom})`
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isMagnifyingGlassActive) {
        magnifyingGlass.style.display = 'none'
        isMagnifyingGlassActive = false
      }
    }
  })

  const hideLocalVideoIcon = document.querySelectorAll('img[is="hide-local-video-icon"]')

  showLocalVideoIcon.style.display = 'none'

  hideLocalVideoIcon.forEach(icon => {
    icon.addEventListener('click', e => {
      e.stopPropagation()
      if (localVideoIsSmall) {
        localVideoComponent.parentNode.style['visibility'] = 'hidden'
      } else {
        remoteVideoComponent.parentNode.style['visibility'] = 'hidden'
      }
      showLocalVideoIcon.style.display = ''
    })
  })

  showLocalVideoIcon.addEventListener('click', () => {
    localVideoComponent.parentNode.style['visibility'] = 'visible'
    remoteVideoComponent.parentNode.style['visibility'] = 'visible'
    showLocalVideoIcon.style.display = 'none'
  })

  document.body.addEventListener('click', (event) => {
    if (
        isChatOpen &&
        event.target !== chatIcon &&
        !isInside(event.target, chatIcon) &&
        event.target !== chatBox &&
        !isInside(event.target, chatBox)
      ) {
        hideElms(chatBoxSelector)
        isChatOpen = false
      }
  })

  callEndModal
    .querySelector('#go-to-home-page-button')
    .addEventListener('click', () => {
      window.redirect('/html/calendar.html')
    }
  )
  callEndModal
    .querySelector('#rejoin-button')
    .addEventListener('click', () => {
      window.redirect(window.location.href)
    }
  )

  function updateSliderTooltip(slider) {
    const value = slider.value
    slider.setAttribute('data-value', value)

    const percent = (value - slider.min) / (slider.max - slider.min)
    slider.style.setProperty('--thumb-position', `${percent * 100}%`)
  }

  magnifyingGlassZoomSlider.addEventListener('input', () => {
    updateSliderTooltip(magnifyingGlassZoomSlider)
  })
  magnifyingGlassZoomSlider.addEventListener('mousemove', () => {
    updateSliderTooltip(magnifyingGlassZoomSlider)
  })
  audioVolumeSlider.addEventListener('input', () => {
    updateSliderTooltip(audioVolumeSlider)
  })
  audioVolumeSlider.addEventListener('mousemove', () => {
    updateSliderTooltip(audioVolumeSlider)
  })
  metronomeVolumeSlider.addEventListener('input', () => {
    updateSliderTooltip(metronomeVolumeSlider)
  })
  metronomeVolumeSlider.addEventListener('mousemove', () => {
    updateSliderTooltip(metronomeVolumeSlider)
  })
  beatRateInput.addEventListener('input', () => {
    updateSliderTooltip(beatRateInput)
  })
  beatRateInput.addEventListener('mousemove', () => {
    updateSliderTooltip(beatRateInput)
  })

  ;(async () => {
    setupSwap()
    await populateVideoAndAudioSelectors()
    navigator.mediaDevices.ondevicechange = async () => {
      await populateVideoAndAudioSelectors()
    }
    notificationSoundBuffer = await loadNotificationSound()
  })()
}
