(function () {
  var C = window.QXFRAME9A7C2 && window.QXFRAME9A7C2.Components;
  if (!C) return;
  // Stage 4 actions are local demonstrations; no payment, deployment, activation or subscription occurs.
  function pvCard(id) { return document.querySelector('[data-card="' + id + '"]'); }
  var actionLabels = {
    'invoice-pdf':'Download PDF','invoice-pay':'Pay Now',
    'env-edit':'Edit','env-deploy':'Deploy',
    'agent-cancel':'Cancel','agent-enable':'Enable with $100 credits',
    'obs-query':'Create Query','anomaly-upgrade':'Upgrade to Observability Plus',
    'traffic-report':'View report','sleep-detail':'Details',
    'fitness-detail':'View details','analytics-detail':'View Analytics',
    'notfound-home':'Go to homepage'
  };
  function pvAction(card, name, run) {
    if (!card) return;
    var button = Array.prototype.find.call(card.querySelectorAll('button'),function (candidate) { return candidate.textContent.trim() === actionLabels[name]; });
    if (button) button.setAttribute('data-pv-action',name);
    if (button) button.addEventListener('click', run);
    return button;
  }
  function pvStatus(card, message) {
    var node = card.querySelector('[data-pv-action-status]');
    if (!node) {
      node = document.createElement('p');
      node.setAttribute('data-pv-action-status','');
      node.className = 'qxframe9a7c2-form-description';
      var content = card.querySelector('.qxframe9a7c2-card-content');
      if (content) content.appendChild(node);
      else card.insertBefore(node,card.querySelector('.qxframe9a7c2-card-footer'));
    }
    node.textContent = message;
  }
  function pvInfo(title, body) {
    if (!C.Modal) return;
    var content = document.createElement('div');
    content.className = 'qxframe9a7c2-stack is-gap-3';
    var lines = Array.isArray(body) ? body : [body];
    lines.forEach(function (line) {
      var paragraph = document.createElement('p');
      paragraph.className = 'qxframe9a7c2-form-description';
      paragraph.textContent = line;
      content.appendChild(paragraph);
    });
    C.Modal.create({autoOpen:false,width:440,title:title,content:content,
      buttons:[{content:'Close',role:'cancel'}]}).open('preview');
  }
  var invoiceCard = pvCard('invoice');
  pvAction(invoiceCard,'invoice-pdf',function () {
    var text = ['Invoice INV-2847','Design System License  $499.00',
      'Priority Support  $1,188.00','Custom Components  $750.00',
      'Subtotal  $2,437.00','Tax  $0.00','Total Due  $2,437.00'];
    var stream = 'BT /F1 12 Tf 50 770 Td ' + text.map(function (line,i) {
      return (i ? '0 -24 Td ' : '') + '(' + line.replace(/[\\()]/g,'\\$&') + ') Tj';
    }).join(' ') + ' ET';
    var objs = ['<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'];
    var pdf='%PDF-1.4\n',offsets=[0];
    objs.forEach(function (obj,i) { offsets.push(pdf.length); pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n'; });
    var start=pdf.length;
    pdf+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
    offsets.slice(1).forEach(function (offset) { pdf+=String(offset).padStart(10,'0')+' 00000 n \n'; });
    pdf+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';
    var link=document.createElement('a'),url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
    link.href=url;link.download='INV-2847.pdf';document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); },3000);
    pvStatus(invoiceCard,'Invoice PDF generated locally; no payment was made.');
  });
  pvAction(invoiceCard,'invoice-pay',function () {
    pvInfo('Payment unavailable in preview','This is a sample invoice. No charge or checkout can occur in the local preview.');
  });
  var envCard=pvCard('environment-variables');
  var editEnv=pvAction(envCard,'env-edit',function () {
    var api=envCard.querySelector('[data-pv-env-api]');
    var input=api.querySelector('input');
    if (!input) {
      input=document.createElement('input');input.className='qxframe9a7c2-form-input';
      input.value=api.textContent.trim();api.textContent='';api.appendChild(input);
      editEnv.querySelector('.qxframe9a7c2-button-label').textContent='Save Draft';
      input.focus({preventScroll:true});
      pvStatus(envCard,'Editing only the public example URL; secrets remain masked.');
    } else {
      var value=input.value.trim();
      if (!/^https:\/\/[^\s]+$/.test(value)) {
        pvStatus(envCard,'Enter a valid HTTPS API URL before saving the draft.');
        input.focus({preventScroll:true});return;
      }
      api.textContent=value;
      editEnv.querySelector('.qxframe9a7c2-button-label').textContent='Edit';
      pvStatus(envCard,'Local draft saved; environment variables were not deployed.');
    }
  });
  pvAction(envCard,'env-deploy',function () {
    pvInfo('Deploy unavailable in preview','This demonstration has no deployment API. No production environment was changed.');
  });
  var agentCard=pvCard('activate-agent-dialog');
  pvAction(agentCard,'agent-cancel',function () {
    pvStatus(agentCard,'Activation canceled locally; Vercel Agent is not enabled.');
  });
  pvAction(agentCard,'agent-enable',function () {
    pvInfo('Agent activation unavailable','The $100 trial cannot be activated from this preview. No credit or subscription was changed.');
  });
  var obsCard=pvCard('observability-card');
  pvAction(obsCard,'obs-query',function () {
    if (!C.Modal) return;
    var content=document.createElement('div');content.className='qxframe9a7c2-field-group';
    var label=document.createElement('label');label.className='qxframe9a7c2-form-label';
    label.textContent='Sample query (local only)';label.htmlFor='pv-obs-query-text';
    var input=document.createElement('textarea');input.id='pv-obs-query-text';
    input.className='qxframe9a7c2-form-textarea';input.value='SELECT count(*) FROM requests';
    var note=document.createElement('p');note.className='qxframe9a7c2-form-description';
    note.textContent='No query will execute or contact a server.';
    content.append(label,input,note);
    C.Modal.create({autoOpen:false,title:'Create Query',width:440,content:content,
      buttons:[{content:'Close',role:'cancel'}]}).open('preview');
  });
  var anomalyCard=pvCard('anomaly-alert');
  pvAction(anomalyCard,'anomaly-upgrade',function () {
    var target=obsCard&&obsCard.querySelector('[data-pv-action="obs-query"]');
    if (target) { target.scrollIntoView({block:'center'});target.focus({preventScroll:true}); }
    pvStatus(anomalyCard,'Observability example located; no upgrade or charge was made.');
  });
  pvAction(pvCard('bar-chart-card'),'traffic-report',function () {
    pvInfo('Traffic report — sample', ['Desktop: 1,224','Mobile: 860','Mix delta: +42%',
      'Values are from this static Preview 02 illustration; no live analytics connected.']);
  });
  pvAction(pvCard('sleep-report'),'sleep-detail',function () {
    pvInfo('Sleep report — sample',['Total: 7h 24m','Deep: 2h 10m','Light: 3h 48m',
      'REM: 1h 26m','Score: 84. Sample display; no health data is collected.']);
  });
  pvAction(pvCard('weekly-fitness-summary'),'fitness-detail',function () {
    pvInfo('Fitness details — sample',['Relative activity by day: M 84%, T 52%, W 73%, T 66%, F 91%, S 48%, S 61%',
      'These percentages illustrate the existing chart; no fitness service is connected.']);
  });
  pvAction(pvCard('analytics-card'),'analytics-detail',function () {
    pvInfo('Analytics — sample',['Visitors: 418.2K','Change: +10%',
      'This preview shows static example data, not live visitor telemetry.']);
  });
  var notFound=pvCard('not-found');
  var search=notFound&&notFound.querySelector('input[placeholder="Try searching for pages..."]');
  if (search) search.setAttribute('data-pv-local-search','');
  if (search) {
    search.addEventListener('keydown',function (event) {
      if (event.key!=='Enter') return;
      event.preventDefault();
      var query=search.value.trim().toLowerCase();
      if (!query) { pvStatus(notFound,'Enter a card title or keyword to search this preview.');return; }
      var cards=Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
      var match=cards.find(function (card) {
        return card!==notFound && (card.getAttribute('data-card').includes(query) ||
          (card.querySelector('.qxframe9a7c2-card-title,.qxframe9a7c2-empty-title')?.textContent||'').toLowerCase().includes(query));
      });
      if (match) {
        match.scrollIntoView({block:'center'});
        pvStatus(notFound,'Found '+(match.getAttribute('data-card'))+' in this local preview.');
      } else pvStatus(notFound,'No matching Preview 02 card was found.');
    });
  }
  pvAction(notFound,'notfound-home',function () {
    var home=new URL('./index.html',window.location.href).href;
    if (window.parent!==window && window.parent.location.origin===window.location.origin)
      window.parent.location.href=home;
    else window.location.href=home;
  });
})();