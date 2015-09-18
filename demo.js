'use strict'

import $ from 'dominus'
import {parse} from 'omnibox/querystring'
import vectorcam from 'vectorcam'
import injection from './injection'
import visualizer from './visualizer'
import promisees from './lib'
import debounce from 'lodash/function/debounce'
var container = $('.ly-container')
var input = $('.ly-input')
var output = $('.ly-output')
var perma = $('.ng-perma')
var save = $('.ng-save')
var replay = $('.ng-replay')
var first = $('.ng-first')
var prev = $('.ng-prev')
var next = $('.ng-next')
var last = $('.ng-last')
var recorder = $('.ng-recorder')
var download = $('.ng-download')
var downloadIcon = $('i', '.ng-download')
var dreload = debounce(reload, 300)
var original = `var p = fetch('/foo')
  .then(res => res.status, err => console.error(err))

p.catch(err => console.error(err))
p.then(status => console.log(status))
p
  .then(status => status.a.b.c)
  .catch(err => console.error(err))
`
var state = {}
var base = location.pathname.slice(1)
var visualization
var cam

read(location)
listen()

function listen () {
  input.on('keypress change keydown', dreload)
  save.on('click', permalink)
  perma.on('click', follow)
  first.on('click', () => to('first'))
  prev.on('click', () => to('prev'))
  next.on('click', () => to('next'))
  last.on('click', () => to('last'))
  replay.on('click', () => forced(state.code))
  recorder.on('click', toggleRecorder)
}

function follow (e) {
  if (e.which === 1 && !e.metaKey && !e.ctrlKey) {
    read(e.currentTarget)
  }
}

function reload () {
  var code = input.value().trim()
  if (code === state.code) {
    return false
  }
  reset(code)
  state.visualization = visualizer(injection(code))
  if (recording()) {
    record()
  }
}

function to (position) {
  if (state.visualization) {
    state.visualization[position]()
  }
  // toggle classes
}

function recording () {
  return recorder.hasClass('ng-recorder-off') === false
}

function toggleRecorder () {
  if (recording()) {
    recorder.addClass('ng-recorder-off')
    download.addClass('ng-recorder-off')
    resetCam()
  } else {
    recorder.removeClass('ng-recorder-off')
    download.removeClass('ng-recorder-off')
    forced(state.code)
  }
}

function reset (code) {
  console.clear()
  resetCam()
  state = { code }
  download.removeClass('ng-download-ready')
  download.attr('href', null)
  download.attr('download', null)
}

function resetCam () {
  if (cam) {
    cam.reset()
    cam = null
  }
  download.removeClass('ng-download-ready')
  downloadIcon.setClass('fa fa-battery-empty')
}

function record () {
  var svg = $.findOne('.ly-svg')
  var active = debounce(inactive, 4000)

  promisees.on('construct', active)
  promisees.on('blocked', active)
  promisees.on('state', active)

  cam = vectorcam(svg)
  cam.start()
  downloadIcon.setClass('fa fa-battery-quarter')

  function inactive () {
    if (cam) {
      downloadIcon.setClass('fa fa-battery-half')
      cam.stop(recorded)
      cam = null
    }
  }

  function recorded (err, image) {
    if (err) {
      downloadIcon.setClass('fa fa-battery-empty')
      throw err
    }
    state.recording = image
    download.addClass('ng-download-ready')
    download.attr('href', state.recording)
    download.attr('download', new Date().valueOf() + '.gif')
    downloadIcon.setClass('fa fa-battery-full')
  }
}

function forced (code) {
  state.code = null
  input.value(code)
  reload()
}

function read (source) {
  var qs = parse(source.hash.slice(1))
  if (qs.code) {
    forced(qs.code)
  } else {
    forced(original)
  }
}

function permalink () {
  if (state.code === original) {
    location.hash = ''
  } else {
    location.hash = '#code=' + encodeURIComponent(state.code).replace(/%20/g, '+')
  }
}
