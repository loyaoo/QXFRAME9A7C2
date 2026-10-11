// Mounts the runtime QX components used by the preview cards (v3 §7.5: Select, Tabs, Table,
// Slider, Calendar keep their runtime DOM and are aligned through CSS only).
(function () {
  var Q = window.QXFRAME9A7C2;
  if (!Q || !Q.Components) return;
  var C = Q.Components;
  function pairs(text) {
    return String(text || '').split('|').filter(Boolean).map(function (entry) {
      var parts = entry.split('::');
      return { value: parts[0], label: parts[1] === undefined ? parts[0] : parts[1] };
    });
  }
  document.querySelectorAll('[data-pv-select]').forEach(function (host) {
    C.Select.create({
      container: host,
      items: pairs(host.getAttribute('data-options')),
      value: host.getAttribute('data-value') || undefined,
      placeholder: host.getAttribute('data-placeholder') || undefined,
      size: host.getAttribute('data-size') || 'md'
    });
    // A non-searchable QX Select owns a focusable div[tabindex], not an
    // input. Bridge source FieldLabel clicks to the QX-owned focus root.
    var focusId = host.getAttribute('data-pv-label-id');
    if (focusId) {
      var field = host.closest('.qxframe9a7c2-form-field');
      var label = field && field.querySelector('label[for="' + focusId + '"]');
      var root = host.querySelector('.qxframe9a7c2-select[tabindex]');
      if (label && root) {
        root.id = focusId;
        label.addEventListener('click', function () {
          root.focus({ preventScroll: true });
        });
      }
    }
  });
  var sliders = new Map();
  document.querySelectorAll('[data-pv-slider]').forEach(function (host) {
    var raw = String(host.getAttribute('data-value') || '0').split(',').map(Number);
    var options = {
      container: host,
      range: raw.length > 1,
      defaultValue: raw.length > 1 ? raw : raw[0],
      min: Number(host.getAttribute('data-min') || 0),
      max: Number(host.getAttribute('data-max') || 100),
      step: Number(host.getAttribute('data-step') || 1),
      disabled: host.hasAttribute('data-disabled')
    };
    // QX Slider ValueController owns the value. These are read-only authored labels.
    var outputKey = host.getAttribute('data-pv-output');
    if (outputKey) {
      var outputs = Array.prototype.filter.call(document.querySelectorAll('[data-pv-value-for]'), function (node) {
        return node.getAttribute('data-pv-value-for') === outputKey;
      });
      if (outputs.length) {
        options.onChange = function (nextValue) {
          var value = Number(Array.isArray(nextValue) ? nextValue[0] : nextValue);
          if (!Number.isFinite(value)) return;
          var amount = host.getAttribute('data-pv-output-format') === 'money-2' ? String.fromCharCode(36) + value.toFixed(2) : String(value);
          outputs.forEach(function (node) { node.textContent = amount; });
        };
      }
    }
    if (host.closest('[data-card="roller-shades"]')) {
      // Source RollerShades: the controlled value drives both artwork and the active preset.
      options.onChange = function (nextValue) {
        var position = Number(Array.isArray(nextValue) ? nextValue[0] : nextValue);
        if (Number.isFinite(position)) {
          var card = host.closest('[data-card="roller-shades"]');
          var fill = card.querySelector('.pv-shade > div');
          if (fill) fill.style.height = position + '%';
          setToggleValue(card.querySelector('.pv-toggle-group'), position <= 10 ? 'open' : position >= 90 ? 'closed' : 'half');
        }
      };
    }
    var slider = C.Slider.create(options);
    sliders.set(host, slider);
    if (host.hasAttribute('data-pv-track-height')) {
      var root = host.querySelector('.qxframe9a7c2-slider');
      if (root) root.classList.add('is-track-height');
    }
  });
  document.querySelectorAll('[data-pv-tabs]').forEach(function (host) {
    var items = pairs(host.getAttribute('data-items')).map(function (item) { return { key: item.value, label: item.label }; });
    var options = { container: host, items: items, defaultActiveKey: host.getAttribute('data-value') || (items[0] && items[0].key) };
    if (host.getAttribute('data-type')) options.type = host.getAttribute('data-type');
    // The QX Tabs controller owns activation. Panels are authored framework
    // compositions, not a second tab implementation or duplicate styling.
    var group = host.getAttribute('data-pv-tab-group');
    // Limit each Tabs' activation to DIRECT sibling panels. A nested Tabs owner
    // must not have its panels hidden by the outer parent controller.
    var panels = group ? Array.prototype.filter.call(host.parentNode.children, function (node) {
      return node.hasAttribute('data-pv-tab-panel');
    }) : [];
    if (panels.length) {
      options.onChange = function (activeKey) {
        panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-pv-tab-panel') !== String(activeKey); });
      };
    }
    var tabs = C.Tabs.create(options);
    // Author equal-width segmented slots using the framework's reusable Tabs modifier.
    if (host.hasAttribute('data-pv-equal')) tabs.getRootElement().classList.add('is-equal');
    if (panels.length) options.onChange(tabs.activeKey || options.defaultActiveKey);
  });
  // Stage4 source Codespaces Create button: loading feedback for 2s,
  // with QX Button's existing spinner, disabled paint, and no new Token.
  document.querySelectorAll('[data-pv-create-codespace]').forEach(function (button) {
    var timer = null;
    button.addEventListener('click', function () {
      if (button.disabled || timer) return;
      var indicator = button.querySelector('.qxframe9a7c2-button-indicator');
      button.disabled = true;
      button.classList.add('is-loading');
      if (indicator) indicator.hidden = false;
      timer = window.setTimeout(function () {
        timer = null;
        button.disabled = false;
        button.classList.remove('is-loading');
        if (indicator) indicator.hidden = true;
      }, 2000);
    });
  });

  // Both source Preview 02 examples own a real Dialog/AlertDialog.
  // Compose existing QX field/input/select and QX Modal rather than
  // inventing a second overlay, shadow or FocusController.
  var dialogs = {};
  function makeFeedback() {
    var content = document.createElement('div');
    content.className = 'qxframe9a7c2-field-group';
    content.innerHTML =
      '<p class="qxframe9a7c2-form-description">Let us know how we can improve your experience.</p>' +
      '<div class="qxframe9a7c2-flex is-wrap is-gap-3">' +
      '<div class="qxframe9a7c2-form-field is-composed pv-grow"><label class="qxframe9a7c2-form-label" for="pv-feedback-name">Name</label><input id="pv-feedback-name" class="qxframe9a7c2-form-input" placeholder="Your name"></div>' +
      '<div class="qxframe9a7c2-form-field is-composed pv-grow"><label class="qxframe9a7c2-form-label" for="pv-feedback-email">Email</label><input id="pv-feedback-email" type="email" class="qxframe9a7c2-form-input" placeholder="you@example.com"></div></div>' +
      '<div class="qxframe9a7c2-form-field is-composed"><label class="qxframe9a7c2-form-label" for="pv-feedback-category">Category</label><select id="pv-feedback-category" class="qxframe9a7c2-form-select"><option value="general">General</option><option value="bug">Bug Report</option><option value="feature">Feature Request</option><option value="improvement">Improvement</option></select></div>' +
      '<div class="qxframe9a7c2-form-field is-composed"><label class="qxframe9a7c2-form-label" for="pv-feedback-message">Message</label><textarea id="pv-feedback-message" class="qxframe9a7c2-form-textarea" rows="4" placeholder="Tell us what\'s on your mind..."></textarea></div>';
    return content;
  }
  document.querySelectorAll('[data-pv-dialog]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      if (!C.Modal) return;
      var kind = trigger.getAttribute('data-pv-dialog');
      if (!dialogs[kind]) {
        var feedback = kind === 'feedback';
        dialogs[kind] = C.Modal.create({
          autoOpen: false,
          width: feedback ? 480 : 400,
          title: feedback ? 'Share Feedback' : 'Allow accessory to connect?',
          content: feedback ? makeFeedback() : 'Do you want to allow the USB accessory to connect to this device and your data?',
          buttons: feedback
            ? [{ content:'Cancel', role:'cancel' },{ content:'Submit', role:'confirm' }]
            : [{ content:"Don't allow", role:'cancel' },{ content:'Allow', role:'confirm' }]
        });
      }
      dialogs[kind].open('preview');
    });
  });


  // Stage4: File Upload is a local picker/drop demonstration, NOT an upload
  // API. Match the copy ("PNG, JPG, PDF up to 10MB"), reject other/oversized
  // files and never claim a remote upload succeeded.
  var upload = document.querySelector('[data-card="file-upload"]');
  if (upload) {
    var input = upload.querySelector('[data-pv-upload-input]');
    var drop = upload.querySelector('[data-pv-file-drop]');
    var status = upload.querySelector('[data-pv-upload-status]');
    function renderSelectedFile(file) {
      if (!file) return;
      var validType = /\.(png|jpe?g|pdf)$/i.test(file.name) &&
        (!file.type || /^(image\/png|image\/jpeg|application\/pdf)$/.test(file.type));
      status.hidden = false;
      if (!validType) status.textContent = 'Choose a PNG, JPG or PDF file.';
      else if (file.size > 10 * 1024 * 1024) status.textContent = 'File exceeds the 10MB limit.';
      else status.textContent = 'Selected: ' + file.name + ' (local preview only; not uploaded)';
    }
    upload.querySelector('[data-pv-upload-browse]').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { renderSelectedFile(input.files && input.files[0]); });
    ['dragenter','dragover'].forEach(function (type) {
      drop.addEventListener(type, function (event) { event.preventDefault(); });
    });
    drop.addEventListener('drop', function (event) {
      event.preventDefault();
      renderSelectedFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
    });
  }
  // Stage4 Report Bug: Attach File must invoke a real native file picker.
  // Source does not provide an upload endpoint; show selected local name only.
  var bug = document.querySelector('[data-card="report-bug"]');
  if (bug) {
    var bugInput = bug.querySelector('[data-pv-bug-file-input]');
    var bugStatus = bug.querySelector('[data-pv-bug-file-status]');
    bug.querySelector('[data-pv-bug-attach]').addEventListener('click', function () { bugInput.click(); });
    bugInput.addEventListener('change', function () {
      var file = bugInput.files && bugInput.files[0];
      if (!file) return;
      bugStatus.hidden = false;
      bugStatus.textContent = 'Attached locally: ' + file.name;
    });
  }
  // Stage4 Invite Team: append a fresh row using the actual QX Select
  // controller. Cloning a mounted Select DOM would illegally duplicate its
  // state and event owners. Preserve the existing two authored invite rows.
  var invite = document.querySelector('[data-card="invite-team"]');
  if (invite) {
    var rows = invite.querySelector('[data-pv-invite-rows]');
    invite.querySelector('[data-pv-invite-add]').addEventListener('click', function () {
      var row = document.createElement('div');
      row.className = 'qxframe9a7c2-flex';
      var email = document.createElement('input');
      email.type = 'email';
      email.placeholder = 'name@example.com';
      email.className = 'qxframe9a7c2-form-input pv-grow';
      var role = document.createElement('div');
      role.className = 'pv-select pv-w-24';
      row.append(email, role);
      rows.appendChild(row);
      C.Select.create({
        container: role,
        items: pairs('admin::Admin|editor::Editor|viewer::Viewer'),
        value: 'viewer',
        size: 'md'
      });
      email.focus({ preventScroll:true });
    });
    var copy = invite.querySelector('[data-pv-invite-copy]');
    var url = invite.querySelector('.qxframe9a7c2-input-group input[readonly]');
    var copyStatus = invite.querySelector('[data-pv-invite-copy-status]');
    copy.addEventListener('click', function () {
      function report(message) { copyStatus.hidden=false; copyStatus.textContent=message; }
      if (!url) return;
      var text = url.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          report('Invite link copied');
        }, function () {
          url.focus();url.select();
          report('Invite link selected; use Ctrl+C to copy');
        });
      } else {
        url.focus();url.select();
        report('Invite link selected; use Ctrl+C to copy');
      }
    });
  }

  // Stage4 LiveWaveform: microphone is requested ONLY after a real user click.
  // Process is a synthetic preview animation, never labeled microphone data.
  // Keep media streams local, release tracks/AudioContext on stop and unload.
  var waveCard = document.querySelector('[data-card="live-waveform"]');
  if (waveCard) {
    var waveVisual = waveCard.querySelector('[data-pv-wave-visual]');
    var waveStatus = waveCard.querySelector('[data-pv-wave-status]');
    var waveBars = Array.prototype.slice.call(waveVisual.querySelectorAll('rect'));
    var waveStart = waveCard.querySelector('[data-pv-wave-action="listen"]');
    var waveProcess = waveCard.querySelector('[data-pv-wave-action="process"]');
    var waveMode = waveCard.querySelector('[data-pv-wave-action="mode"]');
    var waveState = { active:false, processing:true, mode:'static', stream:null, context:null,
      analyser:null, phase:0, tick:null, generation:0, disposed:false };
    function waveMessage(value) {
      waveStatus.hidden = !value;
      waveStatus.textContent = value || '';
    }
    function waveButton(button, active) {
      button.classList.toggle('is-primary',active);
      button.classList.toggle('is-solid',active);
      button.classList.toggle('is-default',!active);
      button.classList.toggle('is-outlined',!active);
    }
    function syncWave() {
      waveStart.querySelector('.qxframe9a7c2-button-label').textContent =
        (waveState.active ? 'Stop' : 'Start') + ' Listening';
      waveProcess.querySelector('.qxframe9a7c2-button-label').textContent =
        (waveState.processing ? 'Stop' : 'Start') + ' Processing';
      waveMode.querySelector('.qxframe9a7c2-button-label').textContent =
        waveState.mode === 'static' ? 'Static' : 'Scrolling';
      waveButton(waveStart,waveState.active);
      waveButton(waveProcess,waveState.processing);
      waveVisual.setAttribute('data-pv-wave-state',
        waveState.active ? 'listening' : waveState.processing ? 'processing' : 'idle');
      waveVisual.setAttribute('data-pv-wave-mode',waveState.mode);
    }
    function stopMedia() {
      ++waveState.generation;
      if (waveState.stream) {
        waveState.stream.getTracks().forEach(function (track) { track.stop(); });
        waveState.stream = null;
      }
      if (waveState.context) {
        var closing = waveState.context.close();
        if (closing && closing.catch) closing.catch(function () {});
        waveState.context = null;
      }
      waveState.analyser = null;
      waveState.active = false;
    }
    function paintWave() {
      if (waveState.disposed || (!waveState.active && !waveState.processing)) return;
      waveState.phase += 0.18;
      var data = null;
      if (waveState.active && waveState.analyser) {
        data = new Uint8Array(waveState.analyser.frequencyBinCount);
        waveState.analyser.getByteFrequencyData(data);
      }
      waveBars.forEach(function (rect,i) {
        var fraction = i / Math.max(1,waveBars.length - 1);
        var source = data ? data[Math.min(data.length - 1, Math.floor((waveState.mode === 'static'
          ? Math.abs(fraction * 2 - 1) : 1 - fraction) * data.length))] / 255 :
          0.16 + (Math.sin(waveState.phase + i * 0.16) + Math.cos(waveState.phase * 0.7 - i * 0.11) + 2) * 0.1;
        var height = 4 + Math.min(1,Math.max(0,source)) * 56;
        if (waveState.mode === 'static') height *= 0.45 + (1-Math.abs(fraction*2-1))*0.55;
        height = Math.max(4,Math.min(64,height));
        rect.setAttribute('height',height.toFixed(2));
        rect.setAttribute('y',((80-height)/2).toFixed(2));
        rect.setAttribute('opacity',(0.38+source*0.55).toFixed(2));
      });
    }
    waveState.tick = window.setInterval(paintWave,120);
    waveStart.addEventListener('click',function () {
      if (waveState.active) {
        stopMedia();
        waveMessage('Microphone stopped; audio was not recorded or uploaded.');
        syncWave();
        return;
      }
      if (waveStart.disabled) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        waveMessage('Microphone is unavailable in this browser or context.');
        return;
      }
      var version = ++waveState.generation;
      waveStart.disabled = true;
      navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})
        .then(function (stream) {
          if (waveState.disposed || version !== waveState.generation) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            return;
          }
          var AudioCtor = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtor) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            throw Error('AudioContext is unavailable');
          }
          var ctx;
          try {
            ctx = new AudioCtor();
            var analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            ctx.createMediaStreamSource(stream).connect(analyser);
            waveState.stream = stream;
            waveState.context = ctx;
            waveState.analyser = analyser;
          } catch (err) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            if (ctx) { try { ctx.close(); } catch (_) {} }
            throw err;
          }
          waveState.active = true;
          waveState.processing = false;
          waveMessage('Live microphone input (local only; not recorded or uploaded).');
        })
        .catch(function (error) {
          if (version !== waveState.generation || waveState.disposed) return;
          waveMessage('Microphone not started: ' + (error && error.message || 'permission denied'));
        })
        .finally(function () {
          if (version !== waveState.generation || waveState.disposed) return;
          waveStart.disabled = false;
          syncWave();
        });
    });
    waveProcess.addEventListener('click',function () {
      if (!waveState.processing) {
        stopMedia();
        waveState.processing = true;
        waveMessage('Simulated processing animation; microphone is off.');
      } else {
        waveState.processing = false;
        waveMessage('Waveform idle; microphone is off.');
      }
      syncWave();
    });
    waveMode.addEventListener('click',function () {
      waveState.mode = waveState.mode === 'static' ? 'scrolling' : 'static';
      syncWave();
    });
    window.addEventListener('pagehide',function () {
      waveState.disposed = true;
      stopMedia();
      if (waveState.tick) window.clearInterval(waveState.tick);
    },{once:true});
    syncWave();
  }
  // The Preview 02 InviteMembers CTA should lead to the existing InviteTeam
  // composition, not pretend to send an invitation without an API.
  var inviteJump = document.querySelector('[data-pv-jump-invites]');
  if (inviteJump) inviteJump.addEventListener('click',function () {
    var target = document.querySelector('[data-card="invite-team"] [data-pv-invite-add]');
    if (!target) return;
    target.scrollIntoView({block:'nearest'});
    target.focus({preventScroll:true});
  });

  var Calendar = C.Calendar || (Q.BuildingBlocks && Q.BuildingBlocks.Calendar);
  document.querySelectorAll('[data-pv-calendar]').forEach(function (host) {
    if (!Calendar) return;
    // Locked shadcn UpcomingPayments initializes its live Calendar with
    // useState(new Date()). Resolve the demo keyword at mount time, rather
    // than pinning April 2024 to the unrelated transaction copy.
    var authoredValue = host.getAttribute('data-value');
    Calendar.create({ container: host, value: authoredValue === 'today' ? new Date() : authoredValue || undefined });
    if (host.getAttribute('data-pv-calendar-layout') === 'adaptive-month') {
      var calendarRoot = host.querySelector('.qxframe9a7c2-calendar');
      if (calendarRoot) calendarRoot.classList.add('is-adaptive-month');
    }
  });

  // shadcn's single-selection ToggleGroup semantics on the three Preview 01
  // compositions. This is card authoring, not a replacement framework Controller.
  function buttonValue(button) {
    return button.textContent.trim().toLowerCase().replace(/\s+/g, '-');
  }
  function setToggleValue(group, value) {
    if (!group) return;
    group.querySelectorAll('button').forEach(function (button) {
      var selected = buttonValue(button) === value;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function bindSingleToggle(card, onChange, retainSelection) {
    if (!card) return;
    var group = card.querySelector('.pv-toggle-group');
    if (!group) return;
    group.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button || !group.contains(button) || button.disabled) return;
      var value = buttonValue(button);
      var selected = button.getAttribute('aria-pressed') === 'true';
      if (selected && retainSelection) return;
      var next = selected ? '' : value;
      setToggleValue(group, next);
      if (next) onChange(next);
    });
  }
  // BookAppointment composes framework Buttons as a multiple ToggleGroup.
  // The control remains an authored preview, not another framework Controller.
  document.querySelectorAll('[data-pv-multi-toggle]').forEach(function (group) {
    group.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button || !group.contains(button) || button.disabled) return;
      var selected = !button.classList.contains('is-active');
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  });
  var kitchen = document.querySelector('[data-card="kitchen-island"]');
  if (kitchen) {
    var scenes = {
      cooking: [90,70,30,0], dining: [50,40,20,60],
      nightlight: [15,20,0,80], focus: [100,85,0,0]
    };
    var kitchenSliders = Array.prototype.map.call(kitchen.querySelectorAll('[data-pv-slider]'), function (host) {
      return sliders.get(host);
    });
    bindSingleToggle(kitchen, function (name) {
      scenes[name].forEach(function (value, index) { kitchenSliders[index].setValue(value); });
    }, true);
    var masterSwitch = kitchen.querySelector('.qxframe9a7c2-switch-input');
    if (masterSwitch) {
      function syncKitchenEnabled() {
        var enabled = masterSwitch.checked;
        kitchen.querySelectorAll('.pv-toggle-group button').forEach(function (button) { button.disabled = !enabled; });
        kitchenSliders.forEach(function (slider) { slider.setDisabled(!enabled); });
      }
      masterSwitch.addEventListener('change', syncKitchenEnabled);
      syncKitchenEnabled();
    }
  }
  var roller = document.querySelector('[data-card="roller-shades"]');
  if (roller) {
    var rollerHost = roller.querySelector('[data-pv-slider]');
    bindSingleToggle(roller, function (name) {
      var position = name === 'open' ? 0 : name === 'closed' ? 100 : 50;
      sliders.get(rollerHost).setValue(position);
      // Keep the authored media and selection in sync even if setValue is silent.
      roller.querySelector('.pv-shade > div').style.height = position + '%';
      setToggleValue(roller.querySelector('.pv-toggle-group'), name);
    }, true);
  }
  // Upstream ReleaseCatalog changes the active filter pill without filtering
  // its static HOLDINGS list. Do not invent an item-filtering behavior.
  bindSingleToggle(document.querySelector('[data-card="release-catalog"]'), function () {}, false);

  // Pinned NotificationSettings: one indeterminate master reflects 4 choices.
  var notifications = document.querySelector('[data-card="notification-settings"]');
  if (notifications) {
    var checks = Array.prototype.slice.call(notifications.querySelectorAll('.qxframe9a7c2-selectgroup-input[type="checkbox"]'));
    var master = checks.shift();
    if (master && checks.length === 4) {
      function syncMaster() {
        var chosen = checks.filter(function (check) { return check.checked; }).length;
        master.checked = chosen === checks.length;
        master.indeterminate = chosen > 0 && chosen < checks.length;
      }
      master.addEventListener('change', function () {
        checks.forEach(function (check) { check.checked = master.checked; });
        syncMaster();
      });
      checks.forEach(function (check) { check.addEventListener('change', syncMaster); });
      syncMaster();
    }
  }
  document.querySelectorAll('input[data-indeterminate]').forEach(function (input) { input.indeterminate = true; });
})();
