import { useState, useEffect, useRef } from 'react'

const IP_ARRAY = ['http://10.139.170.243']

const SHOT_PROGRAMS = [
  [1, 4, 9, 12],
  [5, 8, 13, 16, 3, 18],
  Array.from({ length: 8 }, (_, i) => i + 1)
]

const WIN_CNT_HORI = 5
const WIN_CNT_VERT = 4
const SHOT_WIN_EDGE = 70
const PADDING = 30
const OFFSET_Y = 32
const IMG_RES_W = 3024
const IMG_RES_H = 4032
const CONST_HEIGHT_SCALE = 3.6
const CONST_WIDTH_SCALE = 1.6
const CONST_PATCH_QR_RATIO = 1.167

function generateSessionId() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const rand = String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  return `${dateStr}_${rand}`
}

function generateCandidatePoints() {
  const points = []
  for (let x = 0; x < WIN_CNT_HORI; x++) {
    for (let y = 0; y < WIN_CNT_VERT; y++) {
      points.push([x, y])
    }
  }
  return points
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    fontFamily: '-apple-system, system-ui, sans-serif',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    padding: '10px 20px',
    backgroundColor: '#111',
    color: '#aaa',
    fontSize: 13,
    borderBottom: '1px solid #1a1a1a',
  },
  video: { width: '100%', display: 'block' },
  shotBox: {
    position: 'absolute',
    border: '2px solid #00ff00',
    pointerEvents: 'none',
  },
  controls: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: { display: 'flex', gap: 10 },
  btn: (bg, disabled) => ({
    flex: 1,
    padding: '12px',
    backgroundColor: disabled ? '#222' : bg,
    color: disabled ? '#555' : '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  toggle: (on) => ({
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: on ? '#34c759' : '#333',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s',
    border: 'none',
  }),
  toggleKnob: (on) => ({
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: '#fff',
    top: 2,
    left: on ? 20 : 2,
    transition: 'left 0.2s',
  }),
  resultsTable: {
    margin: '0 20px 20px',
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #222',
  },
  resultRow: {
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a1a',
    fontSize: 13,
    color: '#ccc',
  },
  groupInfo: {
    padding: '8px 20px',
    display: 'flex',
    gap: 20,
  },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    border: '1px solid #2a2a2a',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  modalInput: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalBtn: (bg) => ({
    width: '100%',
    padding: 14,
    backgroundColor: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: 8,
  }),
  picker: {
    width: '100%',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: 10,
    color: '#fff',
    padding: 10,
    fontSize: 14,
    marginTop: 8,
  },
}

export default function SecondView({ groupNumber, serverNumber, onExit }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [status, setStatus] = useState(`Server No.: ${serverNumber}`)
  const [useFlash, setUseFlash] = useState(false)
  const [useUndistortion, setUseUndistortion] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [shotProgram, setShotProgram] = useState([])
  const [candidatePoints] = useState(generateCandidatePoints)
  const [sessionId] = useState(generateSessionId)
  const [shotBox, setShotBox] = useState(null)
  const [verifyEnabled, setVerifyEnabled] = useState(false)
  const [manufactureEnabled, setManufactureEnabled] = useState(false)
  const [calibrateEnabled, setCalibrateEnabled] = useState(false)
  const [verifyFlag, setVerifyFlag] = useState(false)
  const [manufactureFlag, setManufactureFlag] = useState(false)
  const [authResults, setAuthResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [pickerData, setPickerData] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [modal, setModal] = useState(null)
  const [calibrationBtnPressed, setCalibrationBtnPressed] = useState(false)
  const [calibrationBtnPressTwice, setCalibrationBtnPressTwice] = useState(false)

  const shotIdxRef = useRef(0)
  const shotProgramRef = useRef([])
  const qrCodeInfoRef = useRef('-1')
  const cameraVectorArrayRef = useRef([])
  const qrCodeArrayRef = useRef([])
  const cameraOffsetXRef = useRef(0)
  const cameraOffsetYRef = useRef(0)
  const imageSizeRef = useRef('')
  const calibrationBtnPressedRef = useRef(false)
  const appFeatureRef = useRef('')
  const userChosenCameraParamsRef = useRef('NA')

  const ipToUse = parseInt(serverNumber) || 0
  const serverUrl = IP_ARRAY[ipToUse] || IP_ARRAY[0]

  useEffect(() => { getAppFeatureFromServer() }, [])

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(console.error)
    }
  }, [cameraActive])

  useEffect(() => {
    if (streamRef.current && cameraActive) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track?.getCapabilities?.() || {}
      if (capabilities.torch) {
        track.applyConstraints({ advanced: [{ torch: useFlash }] })
          .catch(e => console.log('Torch error:', e))
      }
    }
  }, [useFlash, cameraActive])

  useEffect(() => { return () => stopStream() }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const getAppFeatureFromServer = async () => {
    try {
      const url = `${serverUrl}:8080/http_app_handler/app_feature_manager.php`
      const res = await fetch(url, { method: 'POST', body: '' })
      const text = await res.text()
      const digits = text.replace(/\D/g, '')
      if (digits.length >= 3) {
        setVerifyEnabled(digits[0] === '1')
        setManufactureEnabled(digits[1] === '1')
        setCalibrateEnabled(digits[digits.length - 1] === '1')
        appFeatureRef.current = text
      }
    } catch (e) {
      console.log('Could not reach server', e)
    }
  }

  const getShotBoxPosition = (idx, program, containerWidth) => {
    if (idx >= program.length) return null
    const p = candidatePoints[program[idx] - 1]
    const width = containerWidth
    const height = containerWidth / IMG_RES_W * IMG_RES_H
    const gapX = (width - 2 * PADDING - SHOT_WIN_EDGE) / (WIN_CNT_HORI - 1)
    const gapY = (height - 2 * PADDING - 3 * SHOT_WIN_EDGE) / (WIN_CNT_VERT - 1)
    const x = PADDING + p[0] * gapX
    const y = PADDING + p[1] * gapY + OFFSET_Y
    return { x, y, w: SHOT_WIN_EDGE, h: SHOT_WIN_EDGE * 3 }
  }

  const startSession = async (program) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: 'continuous' }]
        },
        audio: false
      })
      streamRef.current = stream
      setCameraActive(true)
      shotIdxRef.current = 0
      setShotProgram(program)
      shotProgramRef.current = program
      qrCodeInfoRef.current = '-1'
      cameraVectorArrayRef.current = []
      qrCodeArrayRef.current = []
      const box = getShotBoxPosition(0, program, window.innerWidth)
      setShotBox(box)
      setStatus('Tap the green box to capture')
    } catch (err) {
      showAlert('Camera Error', err.message)
    }
  }

  const handleSelectProgram = (programIdx) => {
    const program = SHOT_PROGRAMS[programIdx]
    if (!useFlash) {
      setModal({
        type: 'confirm',
        title: 'Alert',
        message: 'Camera flash is not on, may result in bad performance',
        onConfirm: () => { setModal(null); startSession(program) },
        onCancel: () => setModal(null),
      })
    } else {
      startSession(program)
    }
  }

  const handleCalibration = () => {
    if (!calibrationBtnPressed) {
      setModal({
        type: 'input',
        title: 'Calibration',
        message: 'Please type in the number of images to take:',
        onConfirm: (value) => {
          const num = parseInt(value)
          if (!num || isNaN(num)) return
          const program = Array.from({ length: num }, (_, i) => i + 1)
          if (calibrateEnabled) {
            calibrationBtnPressedRef.current = true
            setCalibrationBtnPressed(true)
            appFeatureRef.current = 'verify=0|reference=0|calibrate=1'
            startSession(program)
          }
          setModal(null)
        },
        onCancel: () => setModal(null),
      })
    } else {
      if (calibrateEnabled) {
        if (!calibrationBtnPressTwice) {
          calibrationBtnPressedRef.current = true
          appFeatureRef.current = 'verify=0|reference=0|calibrate=1'
          startSession(shotProgram)
        } else {
          issueVerifyCommand()
          setStatus('Calibrating. Please wait ...')
          setCalibrationBtnPressed(false)
          setCalibrationBtnPressTwice(false)
          calibrationBtnPressedRef.current = false
        }
      }
    }
  }

  // Try QR detection in multiple orientations — same as FirstView
  const handleCapture = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    imageSizeRef.current = `${video.videoWidth}x${video.videoHeight}`

    const jsQR = (await import('jsqr')).default
    let code = null

    // Try original orientation
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    code = jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth'
    })

    // Try 90 degrees
    if (!code) {
      const t = document.createElement('canvas')
      const tc = t.getContext('2d')
      t.width = canvas.height
      t.height = canvas.width
      tc.translate(t.width / 2, t.height / 2)
      tc.rotate(Math.PI / 2)
      tc.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
      imageData = tc.getImageData(0, 0, t.width, t.height)
      code = jsQR(imageData.data, t.width, t.height, { inversionAttempts: 'attemptBoth' })
    }

    // Try 270 degrees
    if (!code) {
      const t = document.createElement('canvas')
      const tc = t.getContext('2d')
      t.width = canvas.height
      t.height = canvas.width
      tc.translate(t.width / 2, t.height / 2)
      tc.rotate(-Math.PI / 2)
      tc.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
      imageData = tc.getImageData(0, 0, t.width, t.height)
      code = jsQR(imageData.data, t.width, t.height, { inversionAttempts: 'attemptBoth' })
    }

    setStatus(code ? 'QR detected: ' + code.data : 'No QR found - res: ' + canvas.width + 'x' + canvas.height)

    if (code) {
      qrCodeInfoRef.current = code.data
      const tl = code.location.topLeftCorner
      const tr = code.location.topRightCorner
      const br = code.location.bottomRightCorner

      const qrWidth = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2))
      const L = CONST_PATCH_QR_RATIO * qrWidth
      const centerX = (tl.y + br.y) / 2
      const centerY = (tl.x + br.x) / 2
      const cropHeight = Math.round(CONST_HEIGHT_SCALE * L)
      const cropWidth = Math.round(CONST_WIDTH_SCALE * L)
      const topLeftX = Math.round(centerX - 0.5 * cropWidth)
      const topLeftY = Math.round(centerY - 0.5 * cropHeight)

      cameraOffsetXRef.current = topLeftX
      cameraOffsetYRef.current = topLeftY
      cameraVectorArrayRef.current.push([topLeftX, topLeftY])
      qrCodeArrayRef.current.push(code.data)

      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = cropWidth
      cropCanvas.height = cropHeight
      cropCanvas.getContext('2d').drawImage(canvas, topLeftX, topLeftY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

      const rotCanvas = document.createElement('canvas')
      rotCanvas.width = cropCanvas.height
      rotCanvas.height = cropCanvas.width
      const rotCtx = rotCanvas.getContext('2d')
      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2)
      rotCtx.rotate(Math.PI / 2)
      rotCtx.drawImage(cropCanvas, -cropCanvas.width / 2, -cropCanvas.height / 2)
      rotCanvas.toBlob((blob) => uploadImage(blob), 'image/jpeg', 0.95)
    } else {
      if (!calibrationBtnPressedRef.current) {
        showAlert('Notification', 'No QR Code found.')
      }
      canvas.toBlob((blob) => uploadImage(blob), 'image/jpeg', 0.95)
    }

    const nextIdx = shotIdxRef.current + 1
    shotIdxRef.current = nextIdx

    if (nextIdx < shotProgramRef.current.length) {
      const box = getShotBoxPosition(nextIdx, shotProgramRef.current, window.innerWidth)
      setShotBox(box)
    } else {
      setShotBox(null)
      setCameraActive(false)
      stopStream()
      if (calibrationBtnPressedRef.current) {
        setStatus('Press Calibration button again to send the task to server')
        setCalibrationBtnPressTwice(true)
      } else {
        setStatus('All photos taken. Press Verify or Manufacture.')
        setVerifyFlag(true)
        setManufactureFlag(true)
      }
    }
  }

  const uploadImage = async (blob) => {
    const posIdx = String(shotProgramRef.current[shotIdxRef.current - 1] || 0).padStart(2, '0')
    const url = `${serverUrl}:8080/http_img_receiver/receiver.php`
    const formData = new FormData()
    formData.append('sessionId', sessionId)
    formData.append('posIdx', posIdx)
    formData.append('qr_code_info', qrCodeInfoRef.current)
    formData.append('modelName', navigator.userAgent)
    formData.append('device_unique_id', navigator.userAgent)
    formData.append('offset_x', String(cameraOffsetXRef.current))
    formData.append('offset_y', String(cameraOffsetYRef.current))
    formData.append('app_feature', appFeatureRef.current)
    formData.append('user_chosen_cameraParams_file', userChosenCameraParamsRef.current)
    formData.append('image_size', imageSizeRef.current)
    formData.append('group_number', groupNumber)
    formData.append('use_undistortion_flag', String(useUndistortion))
    formData.append('img', blob, `${posIdx}.jpg`)
    try {
      const res = await fetch(url, { method: 'POST', body: formData })
      const text = await res.text()
      console.log('Upload response:', text)
    } catch (e) {
      console.log('Upload error:', e)
    }
  }

  const issueVerifyCommand = async () => {
    const dataPost = new URLSearchParams({
      user_id: groupNumber,
      patch_index: qrCodeInfoRef.current,
      img_cnt: String(shotProgramRef.current.length),
      session_id: sessionId,
      camera_vec_arr: JSON.stringify(cameraVectorArrayRef.current),
    })
    const url = `${serverUrl}:8080/http_app_handler/handler.php`
    try {
      const res = await fetch(url, { method: 'POST', body: dataPost })
      const text = await res.text()
      setStatus(text)
    } catch (e) {
      setStatus('Server error: ' + e.message)
    }
  }

  const handleSelectCameraParams = async () => {
    const url = `${serverUrl}:8080/http_img_receiver/uploaded_puf_imgs/camera_params_lists/${groupNumber}/camera_params_list.csv`
    try {
      const res = await fetch(url)
      const text = await res.text()
      const params = text.trim().split('\n').map((line) => `Param #${line.trim()}`)
      setPickerData(params)
      setShowPicker(!showPicker)
    } catch (e) {
      showAlert('Notification', 'No calibration parameter can be found.')
    }
  }

  const handleShowResults = async () => {
    if (showResults) { setShowResults(false); return }
    const url = `${serverUrl}:8080/http_img_receiver/uploaded_puf_imgs/${groupNumber}ResultsList.csv`
    try {
      const res = await fetch(url)
      const text = await res.text()
      setAuthResults(processResultsStr(text))
      setShowResults(true)
    } catch (e) {
      showAlert('Notification', 'No result can be found.')
    }
  }

  const processResultsStr = (str) => {
    return str.trim().split('\n').map(line => {
      const parts = line.split(',')
      if (!parts || parts.length < 3) return line
      let eTime = (parts[1] || '').replace(/-/g, ':').substring(0, 5)
      let eDate = (parts[0] || '').replace(/-/g, '/').substring(5)
      if (parts[2] === '-') {
        const corr = Math.max(parseFloat(parts[4] || 0), parseFloat(parts[5] || 0))
        return `Corr = ${corr.toFixed(4)}, at ${eTime} on ${eDate}`
      }
      return `${parts[2]}, at ${eTime} on ${eDate}`
    })
  }

  const showAlert = (title, message) => {
    setModal({ type: 'alert', title, message, onConfirm: () => setModal(null) })
  }

  const handleVerify = () => {
    if (verifyFlag) {
      setStatus('Verifying. Please wait ...')
      issueVerifyCommand()
      setVerifyFlag(false)
    }
  }

  const handleManufacture = () => {
    if (manufactureFlag) {
      setStatus('Manufacturing. Please wait ...')
      issueVerifyCommand()
      setManufactureFlag(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ fontSize: 16, fontWeight: '700' }}>PUF Scanner II</div>
        <button style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: 14, cursor: 'pointer' }} onClick={onExit}>
          Exit
        </button>
      </div>

      <div style={styles.groupInfo}>
        <div>
          <div style={styles.label}>Group No.</div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{groupNumber}</div>
        </div>
        <div>
          <div style={styles.label}>Server No.</div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{serverNumber}</div>
        </div>
      </div>

      <div style={styles.status}>{status}</div>

      {cameraActive && (
        <div style={{ position: 'relative', width: '100%' }}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          {shotBox && (
            <div
              style={{ ...styles.shotBox, left: shotBox.x, top: shotBox.y, width: shotBox.w, height: shotBox.h, cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={handleCapture}
            />
          )}
        </div>
      )}

      {/* Visible canvas for debugging, shows what was captured 
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} /> */}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={styles.controls}>
        <div style={styles.toggleRow}>
          <span style={{ fontSize: 14, color: '#aaa' }}>Flash {useFlash ? 'On' : 'Off'}</span>
          <button style={styles.toggle(useFlash)} onClick={() => setUseFlash(!useFlash)}>
            <div style={styles.toggleKnob(useFlash)} />
          </button>
        </div>

        <div style={styles.toggleRow}>
          <span style={{ fontSize: 14, color: '#aaa' }}>Undistortion {useUndistortion ? 'On' : 'Off'}</span>
          <button style={styles.toggle(useUndistortion)} onClick={() => setUseUndistortion(!useUndistortion)}>
            <div style={styles.toggleKnob(useUndistortion)} />
          </button>
        </div>

        <div style={styles.row}>
          <button style={styles.btn('#1a6ef5', false)} onClick={() => handleSelectProgram(0)}>Program 1</button>
          <button style={styles.btn('#1a6ef5', false)} onClick={() => handleSelectProgram(1)}>Program 2</button>
          <button style={styles.btn('#1a6ef5', false)} onClick={() => handleSelectProgram(2)}>Program 3</button>
        </div>

        <div style={styles.row}>
          <button style={styles.btn('#8e44ad', !calibrateEnabled)} onClick={handleCalibration} disabled={!calibrateEnabled}>
            {calibrationBtnPressTwice ? 'Send Calibration' : 'Calibration'}
          </button>
          <button style={styles.btn('#555', false)} onClick={handleSelectCameraParams}>
            Camera Params
          </button>
        </div>

        {showPicker && pickerData.length > 0 && (
          <select
            style={styles.picker}
            onChange={(e) => {
              userChosenCameraParamsRef.current = e.target.value
              setStatus(e.target.value)
            }}
          >
            {pickerData.map((item, i) => (
              <option key={i} value={item}>{item}</option>
            ))}
          </select>
        )}

        <div style={styles.row}>
          <button style={styles.btn('#34c759', !verifyFlag)} onClick={handleVerify} disabled={!verifyFlag}>
            Verify
          </button>
          <button style={styles.btn('#ff9500', !manufactureFlag)} onClick={handleManufacture} disabled={!manufactureFlag}>
            Manufacture
          </button>
        </div>

        <div style={styles.row}>
          <button style={styles.btn('#555', false)} onClick={handleShowResults}>
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>
        </div>
      </div>

      {showResults && authResults.length > 0 && (
        <div style={styles.resultsTable}>
          {authResults.map((r, i) => (
            <div key={i} style={styles.resultRow}>{r}</div>
          ))}
        </div>
      )}

      {modal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>{modal.title}</div>
            <div style={styles.modalText}>{modal.message}</div>
            {modal.type === 'input' && (
              <input
                style={styles.modalInput}
                type="number"
                placeholder="Enter number"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && modal.onConfirm(e.target.value)}
              />
            )}
            {modal.type === 'confirm' ? (
              <>
                <button style={styles.modalBtn('#0a84ff')} onClick={modal.onConfirm}>Continue</button>
                <button style={styles.modalBtn('#333')} onClick={modal.onCancel}>Cancel</button>
              </>
            ) : modal.type === 'input' ? (
              <>
                <button style={styles.modalBtn('#0a84ff')} onClick={() => {
                  const input = document.querySelector('input[type="number"]')
                  modal.onConfirm(input?.value)
                }}>OK</button>
                <button style={styles.modalBtn('#333')} onClick={modal.onCancel}>Cancel</button>
              </>
            ) : (
              <button style={styles.modalBtn('#0a84ff')} onClick={modal.onConfirm}>OK</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}