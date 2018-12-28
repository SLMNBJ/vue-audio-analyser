class MusicGraph {
  constructor() {
    this.submitBtn = document.querySelector('.submit-btn');
    this.pauseBtn = document.querySelector('.pause-btn');
    this.urlInput = document.querySelector('.url-input');
    this.samplesCanvas = document.querySelector('.samples');
    this.samplesCtx = this.samplesCanvas.getContext('2d');
    this.equalizerCanvas = document.querySelector('.equalizer');
    this.equalizerCtx = this.equalizerCanvas.getContext('2d');
    this.winW = window.outerWidth;
    this.winH = window.outerHeight;
    this.url = null;
    this.atx = new AudioContext();
    this.audioSource = this.atx.createBufferSource();
    this.analyser = this.atx.createAnalyser();
    this.analyser.fftSize = 64;
    this.equalizerFbcArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.samplesFbcArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.rafId = 0;
    this.paused = false;
    this.decodeAudio = null;
    this.position = 0;
    this.eventListeners();
  }

  eventListeners() {
    this.submitBtn.addEventListener('click', () => {
      const value = this.urlInput.value;
      if(this.isUrl(value)) {
        this.url = value;
        this.getStream();
      } else {
        // che facciamo ?
      }
    });

    this.pauseBtn.addEventListener('click', () => {
      if(this.atx.state === 'suspended') {
        this.atx.resume().then(() => {
          this.pauseBtn.textContent = 'Pause';
          this.paused = false;
        });
      } else {
        this.atx.suspend().then(() => {
          this.pauseBtn.textContent = 'Resume';
          this.paused = true;
        });
      }
    });

    window.addEventListener('resize', () => {
      this.winW = window.outerWidth;
      this.winH = window.outerHeight;

      this.equalizerCanvas.width = this.winW;
    });
  }

  isUrl(string) {
    const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(string);
  }

  async getStream() {
    const encodeUrl = encodeURIComponent(this.url);
    const response = await fetch(`/stream?videoUrl=${encodeUrl}`);
    const buffer = await response.arrayBuffer();
    this.processAudioBuffer(buffer);
  }

  audioEndHandler() {
    window.cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    this.audioSource.disconnect();
  }

  processAudioBuffer(buffer) {
    this.atx.decodeAudioData(buffer)
    .then(decodedAudio => {
      this.decodeAudio = decodedAudio;
      this.audioSource.buffer = decodedAudio;
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.atx.destination);
      this.initCanvas();
      setTimeout(() => {
        this.audioSource.start(this.atx.currentTime);
        this.audioSource.onended = this.audioEndHandler;
        this.draw();
      }, 100);
    });
  }

  updateSamples(fbcArray) {
    fbcArray.sort((a,b) => (a-b));
    const min = (fbcArray[0] *this.samplesCanvas.height)/255;
    const max = (fbcArray[fbcArray.length - 1]*this.samplesCanvas.height)/255;
    this.samplesCtx.beginPath();
    this.samplesCtx.moveTo(this.position, max);
    this.samplesCtx.lineTo(this.position, min);
    this.samplesCtx.strokeStyle = '#009290';
    this.samplesCtx.lineWidth = '1.1';
    this.samplesCtx.stroke();
    this.position++;
  }

  updateEqualizer(fbcArray) {
    this.equalizerCtx.fillStyle = '#3e3e40';
    this.equalizerCtx.fillRect(0, 0, this.equalizerCanvas.width, this.equalizerCanvas.height);
    const len = fbcArray.length;
    const sampleWidth = this.winW / len;
    
    for(let i = 0; i < len; i++) {
      this.equalizerCtx.beginPath();
      this.equalizerCtx.moveTo(i*sampleWidth, 0);
      this.equalizerCtx.lineTo(i*sampleWidth, fbcArray[i]*300/255);
      this.equalizerCtx.strokeStyle = '#009290';
      this.equalizerCtx.lineWidth = sampleWidth - 1;
      this.equalizerCtx.stroke();
    }
  }

  draw() {
    this.rafId = window.requestAnimationFrame(this.draw.bind(this));
    if(!this.paused) {
      this.analyser.getByteTimeDomainData(this.samplesFbcArray);
      this.analyser.getByteFrequencyData(this.equalizerFbcArray);
      this.updateSamples(this.samplesFbcArray);
      this.updateEqualizer(this.equalizerFbcArray);
    }
  }

  initCanvas() {
    this.initSamplesCanvas();
    this.initEqualizerCanvas();
  }

  initSamplesCanvas() {
    const height = 300;
    const secWidth = 100;
    const secHeight = height;
    const totalSecs = this.audioSource.buffer.duration;
    const width = totalSecs * secWidth;
    
    this.samplesCanvas.width = width;
    this.samplesCanvas.height = height
    this.samplesCtx.fillStyle = '#3e3e40';
    this.samplesCtx.fillRect(0, 0, this.samplesCanvas.width, this.samplesCanvas.height);
    
    // center horizontal line
    this.samplesCtx.beginPath();
    this.samplesCtx.moveTo(0, secHeight / 2);
    this.samplesCtx.lineTo(width, secHeight / 2);
    this.samplesCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.samplesCtx.lineWidth = '2'
    this.samplesCtx.stroke();
    
    // seconds blocks
    for (let i = 0; i < totalSecs; i++) {
      this.samplesCtx.beginPath();
      this.samplesCtx.moveTo(i * secWidth, 0);
      this.samplesCtx.lineTo(i * secWidth, secHeight);
      this.samplesCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.samplesCtx.lineWidth = '2'
      this.samplesCtx.stroke();
    }
  }

  initEqualizerCanvas() {
    const height = 300;
    const width = this.winW;
    
    this.equalizerCanvas.width = width;
    this.equalizerCanvas.height = height;
    this.equalizerCtx.fillStyle = '#3e3e40';
    this.equalizerCtx.fillRect(0, 0, this.equalizerCanvas.width, this.equalizerCanvas.height);
  }
}

new MusicGraph()