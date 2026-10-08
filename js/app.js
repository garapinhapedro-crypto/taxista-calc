(function () {
  'use strict';

  var Calc = window.TaxistaCalc;
  var Store = window.TaxistaStorage;

  // ---------- Navegação entre telas ----------
  var telas = document.querySelectorAll('.screen');
  var navBtns = document.querySelectorAll('.nav-inferior button');

  function irParaTela(id) {
    telas.forEach(function (t) { t.classList.toggle('ativa', t.id === id); });
    navBtns.forEach(function (b) { b.classList.toggle('ativo', b.dataset.tela === id); });
    if (id === 'telaHistorico') renderHistorico();
    if (id === 'telaConfig') renderConfig();
  }
  navBtns.forEach(function (b) {
    b.addEventListener('click', function () { irParaTela(b.dataset.tela); });
  });

  // ---------- Toast ----------
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('visivel'); }, 2200);
  }

  // ---------- Overlays genéricos ----------
  function abrirOverlay(id) { document.getElementById(id).classList.add('visivel'); }
  function fecharOverlay(id) { document.getElementById(id).classList.remove('visivel'); }

  // ================= TELA CALCULAR =================
  var campos = {
    kmBaseOrigem: document.getElementById('kmBaseOrigem'),
    kmOrigemDestino: document.getElementById('kmOrigemDestino'),
    kmDestinoBase: document.getElementById('kmDestinoBase'),
    ratePerKm: document.getElementById('ratePerKm'),
    taxPercent: document.getElementById('taxPercent'),
    marginPercent: document.getElementById('marginPercent'),
    driverOffer: document.getElementById('driverOffer')
  };

  var res = {
    totalKm: document.getElementById('resTotalKm'),
    tripValue: document.getElementById('resTripValue'),
    tripValuePerKm: document.getElementById('resTripValuePerKm'),
    ideal: document.getElementById('resIdeal'),
    idealPerKm: document.getElementById('resIdealPerKm'),
    ceiling: document.getElementById('resCeiling'),
    ceilingPerKm: document.getElementById('resCeilingPerKm'),
    taxAmount: document.getElementById('resTaxAmount'),
    taxAmountPerKm: document.getElementById('resTaxAmountPerKm'),
    profit: document.getElementById('resProfit'),
    profitPerKm: document.getElementById('resProfitPerKm'),
    rotuloLucro: document.getElementById('rotuloLucro')
  };

  var banner = {
    el: document.getElementById('bannerStatus'),
    titulo: document.getElementById('bannerTitulo'),
    detalhe: document.getElementById('bannerDetalhe')
  };

  function lerInputs() {
    return {
      kmBaseOrigem: Calc.parseNumberBR(campos.kmBaseOrigem.value),
      kmOrigemDestino: Calc.parseNumberBR(campos.kmOrigemDestino.value),
      kmDestinoBase: Calc.parseNumberBR(campos.kmDestinoBase.value),
      ratePerKm: Calc.parseNumberBR(campos.ratePerKm.value),
      taxPercent: Calc.parseNumberBR(campos.taxPercent.value),
      marginPercent: Calc.parseNumberBR(campos.marginPercent.value),
      driverOffer: campos.driverOffer.value.trim() === '' ? null : Calc.parseNumberBR(campos.driverOffer.value)
    };
  }

  function recalcular() {
    var input = lerInputs();
    var r = Calc.calcularViagem(input);

    res.totalKm.textContent = Calc.formatKm(r.totalKm);
    res.tripValue.textContent = Calc.formatBRL(r.tripValue);
    res.tripValuePerKm.textContent = Calc.formatPerKm(r.tripValuePerKm);
    res.ideal.textContent = Calc.formatBRL(r.ideal);
    res.idealPerKm.textContent = Calc.formatPerKm(r.idealPerKm);
    res.ceiling.innerHTML = Calc.formatBRL(r.ceiling) + ' <small>' + Calc.formatPerKm(r.ceilingPerKm) + '</small>';
    res.taxAmount.innerHTML = Calc.formatBRL(r.taxAmount) + ' <small>' + Calc.formatPerKm(r.taxAmountPerKm) + '</small>';

    if (r.status) {
      // Oferta ao taxista preenchida: lucro real com base no que você digitou.
      res.rotuloLucro.textContent = 'Lucro estimado';
      res.profit.innerHTML = Calc.formatBRL(r.profit) + ' <small>' + Calc.formatPerKm(r.profitPerKm) + '</small>';

      banner.el.classList.add('visivel');
      banner.el.classList.remove('verde', 'amarelo', 'vermelho');
      banner.el.classList.add(r.status);

      if (r.status === 'verde') {
        banner.titulo.textContent = '✅ Oferta dentro do ideal';
        banner.detalhe.textContent = 'Imposto coberto e margem cheia. Lucro: ' + Calc.formatBRL(r.profit);
      } else if (r.status === 'amarelo') {
        banner.titulo.textContent = '⚠️ Imposto coberto, margem reduzida';
        banner.detalhe.textContent = 'Ainda sobra lucro: ' + Calc.formatBRL(r.profit);
      } else {
        banner.titulo.textContent = '🛑 Acima do teto — prejuízo';
        banner.detalhe.textContent = 'Você paga ' + Calc.formatBRL(r.lossAmount) + ' de imposto do próprio bolso.';
      }
    } else {
      // Sem oferta digitada: assume que vai pagar o Ideal ao motorista (lucro = sua margem).
      res.rotuloLucro.textContent = 'Lucro estimado (pagando o ideal)';
      res.profit.innerHTML = Calc.formatBRL(r.marginAmount) + ' <small>' + Calc.formatPerKm(r.marginAmountPerKm) + '</small>';
      banner.el.classList.remove('visivel', 'verde', 'amarelo', 'vermelho');
    }

    return { input: input, result: r };
  }

  Object.keys(campos).forEach(function (k) {
    campos[k].addEventListener('input', recalcular);
  });

  document.getElementById('btnLimpar').addEventListener('click', function () {
    Object.keys(campos).forEach(function (k) { campos[k].value = ''; });
    recalcular();
  });

  // ---------- Salvar viagem ----------
  var settingsCache = Store.getSettings();

  function aplicarDefaults() {
    settingsCache = Store.getSettings();
    if (campos.taxPercent.value === '') campos.taxPercent.value = settingsCache.defaultTaxPercent;
    if (campos.marginPercent.value === '') campos.marginPercent.value = settingsCache.defaultMarginPercent;
    if (settingsCache.defaultRatePerKm != null && campos.ratePerKm.value === '') {
      campos.ratePerKm.value = String(settingsCache.defaultRatePerKm).replace('.', ',');
    }
    recalcular();
  }

  document.getElementById('btnSalvarViagem').addEventListener('click', function () {
    var atual = recalcular();
    if (atual.result.totalKm <= 0) {
      toast('Preencha ao menos um trecho de km.');
      return;
    }
    document.getElementById('inputValorFinal').value = campos.driverOffer.value || '';
    document.getElementById('inputLabel').value = '';
    document.getElementById('inputMotorista').value = '';
    atualizarDatalistMotoristas();
    abrirOverlay('overlaySalvar');
  });

  document.getElementById('btnFecharSalvar').addEventListener('click', function () { fecharOverlay('overlaySalvar'); });

  document.getElementById('btnConfirmarSalvar').addEventListener('click', function () {
    var atual = recalcular();
    var input = atual.input, r = atual.result;
    var motorista = document.getElementById('inputMotorista').value.trim();
    var valorFinalStr = document.getElementById('inputValorFinal').value;
    var valorFinal = valorFinalStr.trim() === '' ? null : Calc.parseNumberBR(valorFinalStr);
    var lucroFinal = valorFinal != null ? (r.tripValue - r.taxAmount - valorFinal) : null;

    var trip = {
      createdAt: new Date().toISOString(),
      label: document.getElementById('inputLabel').value.trim(),
      kmBaseOrigem: input.kmBaseOrigem,
      kmOrigemDestino: input.kmOrigemDestino,
      kmDestinoBase: input.kmDestinoBase,
      totalKm: r.totalKm,
      ratePerKm: input.ratePerKm,
      taxPercent: input.taxPercent,
      marginPercent: input.marginPercent,
      tripValue: r.tripValue,
      ceiling: r.ceiling,
      ideal: r.ideal,
      taxAmount: r.taxAmount,
      driverName: motorista || null,
      finalAmount: valorFinal,
      profit: lucroFinal
    };

    Store.addTrip(trip);

    if (motorista && settingsCache.drivers.indexOf(motorista) === -1) {
      settingsCache.drivers.push(motorista);
      Store.saveSettings(settingsCache);
    }

    fecharOverlay('overlaySalvar');
    toast('Viagem salva.');
  });

  // ================= CALCULADORA (drawer) =================
  var visor = document.getElementById('visorCalc');
  var calcState = { atual: '0', anterior: null, operador: null, resetarProximo: false };

  function atualizarVisor() {
    visor.textContent = calcState.atual;
  }

  function calcularOperacao(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 0 : a / b;
      default: return b;
    }
  }

  function paraNumero(str) { return parseFloat(String(str).replace(',', '.')) || 0; }

  function teclaCalc(key) {
    if (key >= '0' && key <= '9') {
      if (calcState.atual === '0' || calcState.resetarProximo) {
        calcState.atual = key;
        calcState.resetarProximo = false;
      } else if (calcState.atual.replace('-', '').replace(',', '').length < 15) {
        calcState.atual += key;
      }
    } else if (key === ',') {
      if (calcState.resetarProximo) { calcState.atual = '0,'; calcState.resetarProximo = false; }
      else if (calcState.atual.indexOf(',') === -1) calcState.atual += ',';
    } else if (key === 'back') {
      calcState.atual = calcState.atual.length > 1 ? calcState.atual.slice(0, -1) : '0';
    } else if (key === 'C') {
      calcState = { atual: '0', anterior: null, operador: null, resetarProximo: false };
    } else if (key === '%') {
      calcState.atual = String(paraNumero(calcState.atual) / 100).replace('.', ',');
    } else if (key === '=') {
      if (calcState.operador && calcState.anterior != null) {
        var r = calcularOperacao(calcState.anterior, paraNumero(calcState.atual), calcState.operador);
        calcState.atual = String(r).replace('.', ',');
        calcState.anterior = null;
        calcState.operador = null;
        calcState.resetarProximo = true;
      }
    } else { // operador +, -, *, /
      if (calcState.operador && !calcState.resetarProximo) {
        var res2 = calcularOperacao(calcState.anterior, paraNumero(calcState.atual), calcState.operador);
        calcState.anterior = res2;
        calcState.atual = String(res2).replace('.', ',');
      } else {
        calcState.anterior = paraNumero(calcState.atual);
      }
      calcState.operador = key;
      calcState.resetarProximo = true;
    }
    atualizarVisor();
  }

  document.querySelectorAll('.teclado-calc button').forEach(function (btn) {
    btn.addEventListener('click', function () { teclaCalc(btn.dataset.key); });
  });

  document.getElementById('btnAbrirCalc').addEventListener('click', function () { abrirOverlay('overlayCalc'); });
  document.getElementById('btnFecharCalc').addEventListener('click', function () { fecharOverlay('overlayCalc'); });

  // ================= TELA HISTÓRICO =================
  function mesChave(isoDate) {
    var d = new Date(isoDate);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function mesLabel(chave) {
    var partes = chave.split('-');
    var nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return nomes[parseInt(partes[1], 10) - 1] + '/' + partes[0];
  }

  var filtroMesSelect = document.getElementById('filtroMes');

  function renderHistorico() {
    var trips = Store.getTrips();

    var meses = Array.from(new Set(trips.map(function (t) { return mesChave(t.createdAt); }))).sort().reverse();
    var selecionado = filtroMesSelect.value || 'todos';
    filtroMesSelect.innerHTML = '<option value="todos">Todos os meses</option>' +
      meses.map(function (m) { return '<option value="' + m + '">' + mesLabel(m) + '</option>'; }).join('');
    if ([].slice.call(filtroMesSelect.options).some(function (o) { return o.value === selecionado; })) {
      filtroMesSelect.value = selecionado;
    } else {
      filtroMesSelect.value = 'todos';
    }

    var filtrados = filtroMesSelect.value === 'todos' ? trips : trips.filter(function (t) { return mesChave(t.createdAt) === filtroMesSelect.value; });

    var totTripValue = 0, totTax = 0, totPago = 0, totLucro = 0;
    filtrados.forEach(function (t) {
      totTripValue += t.tripValue || 0;
      totTax += t.taxAmount || 0;
      totPago += t.finalAmount || 0;
      totLucro += t.profit != null ? t.profit : 0;
    });

    document.getElementById('totalViagens').textContent = filtrados.length;
    document.getElementById('totalTripValue').textContent = Calc.formatBRL(totTripValue);
    document.getElementById('totalTax').textContent = Calc.formatBRL(totTax);
    document.getElementById('totalPago').textContent = Calc.formatBRL(totPago);
    document.getElementById('totalLucro').textContent = Calc.formatBRL(totLucro);

    var lista = document.getElementById('listaViagens');
    if (filtrados.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhuma viagem salva ainda.</div>';
      return;
    }
    lista.innerHTML = filtrados.map(function (t) {
      var data = new Date(t.createdAt);
      var dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      var titulo = t.label || (t.driverName ? 'Motorista: ' + t.driverName : Calc.formatKm(t.totalKm));
      return '<div class="item-viagem" data-id="' + t.id + '">' +
        '<div class="info-principal">' +
        '<div class="label-viagem">' + escapeHtml(titulo) + '</div>' +
        '<div class="data-viagem">' + dataStr + '</div>' +
        '</div>' +
        '<div class="valor-viagem">' + Calc.formatBRL(t.tripValue) + '<small>' + Calc.formatKm(t.totalKm) + '</small></div>' +
        '</div>';
    }).join('');

    lista.querySelectorAll('.item-viagem').forEach(function (el) {
      el.addEventListener('click', function () { abrirDetalhe(el.dataset.id); });
    });
  }

  filtroMesSelect.addEventListener('change', renderHistorico);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Detalhe / editar / excluir / reabrir ----------
  var detalheAtualId = null;

  function abrirDetalhe(id) {
    var t = Store.getTrips().find(function (x) { return x.id === id; });
    if (!t) return;
    detalheAtualId = id;
    document.getElementById('detalheTitulo').textContent = t.label || Calc.formatKm(t.totalKm);
    document.getElementById('detalheConteudo').innerHTML =
      linhaDetalhe('Km total', Calc.formatKm(t.totalKm)) +
      linhaDetalhe('Valor da viagem', Calc.formatBRL(t.tripValue)) +
      linhaDetalhe('Teto', Calc.formatBRL(t.ceiling)) +
      linhaDetalhe('Ideal', Calc.formatBRL(t.ideal)) +
      linhaDetalhe('Imposto/Margem', t.taxPercent + '% / ' + t.marginPercent + '%');
    atualizarDatalistMotoristas();
    document.getElementById('detalheMotorista').value = t.driverName || '';
    document.getElementById('detalheValorFinal').value = t.finalAmount != null ? String(t.finalAmount).replace('.', ',') : '';
    abrirOverlay('overlayDetalhe');
  }

  function linhaDetalhe(rotulo, valor) {
    return '<div class="resultado-linha"><span class="rotulo">' + rotulo + '</span><span class="valor">' + valor + '</span></div>';
  }

  document.getElementById('btnFecharDetalhe').addEventListener('click', function () { fecharOverlay('overlayDetalhe'); });

  document.getElementById('btnSalvarDetalhe').addEventListener('click', function () {
    if (!detalheAtualId) return;
    var t = Store.getTrips().find(function (x) { return x.id === detalheAtualId; });
    if (!t) return;
    var motorista = document.getElementById('detalheMotorista').value.trim();
    var valorStr = document.getElementById('detalheValorFinal').value;
    var valorFinal = valorStr.trim() === '' ? null : Calc.parseNumberBR(valorStr);
    var lucro = valorFinal != null ? (t.tripValue - t.taxAmount - valorFinal) : null;
    Store.updateTrip(detalheAtualId, { driverName: motorista || null, finalAmount: valorFinal, profit: lucro });
    if (motorista && settingsCache.drivers.indexOf(motorista) === -1) {
      settingsCache.drivers.push(motorista);
      Store.saveSettings(settingsCache);
    }
    fecharOverlay('overlayDetalhe');
    renderHistorico();
    toast('Viagem atualizada.');
  });

  document.getElementById('btnReabrirDetalhe').addEventListener('click', function () {
    if (!detalheAtualId) return;
    var t = Store.getTrips().find(function (x) { return x.id === detalheAtualId; });
    if (!t) return;
    campos.kmBaseOrigem.value = t.kmBaseOrigem ? String(t.kmBaseOrigem).replace('.', ',') : '';
    campos.kmOrigemDestino.value = t.kmOrigemDestino ? String(t.kmOrigemDestino).replace('.', ',') : '';
    campos.kmDestinoBase.value = t.kmDestinoBase ? String(t.kmDestinoBase).replace('.', ',') : '';
    campos.ratePerKm.value = t.ratePerKm ? String(t.ratePerKm).replace('.', ',') : '';
    campos.taxPercent.value = t.taxPercent != null ? String(t.taxPercent).replace('.', ',') : '';
    campos.marginPercent.value = t.marginPercent != null ? String(t.marginPercent).replace('.', ',') : '';
    campos.driverOffer.value = t.finalAmount != null ? String(t.finalAmount).replace('.', ',') : '';
    recalcular();
    fecharOverlay('overlayDetalhe');
    irParaTela('telaCalcular');
    toast('Viagem carregada no cálculo.');
  });

  document.getElementById('btnExcluirDetalhe').addEventListener('click', function () {
    if (!detalheAtualId) return;
    if (!confirm('Excluir esta viagem? Essa ação não pode ser desfeita.')) return;
    Store.deleteTrip(detalheAtualId);
    fecharOverlay('overlayDetalhe');
    renderHistorico();
    toast('Viagem excluída.');
  });

  // ---------- Exportar CSV ----------
  document.getElementById('btnExportarCSV').addEventListener('click', function () {
    var trips = Store.getTrips();
    if (trips.length === 0) { toast('Nenhuma viagem para exportar.'); return; }
    var cols = ['Data', 'Rotulo', 'KmBaseOrigem', 'KmOrigemDestino', 'KmDestinoBase', 'KmTotal',
      'RatePorKm', 'ImpostoPct', 'MargemPct', 'ValorViagem', 'Teto', 'Ideal', 'ImpostoValor',
      'Motorista', 'ValorFinalPago', 'Lucro'];
    var linhas = [cols.join(';')];
    trips.slice().reverse().forEach(function (t) {
      var data = new Date(t.createdAt).toLocaleString('pt-BR');
      var campo = function (v) { return v == null ? '' : String(v).replace('.', ','); };
      linhas.push([
        data, (t.label || '').replace(/;/g, ','), campo(t.kmBaseOrigem), campo(t.kmOrigemDestino),
        campo(t.kmDestinoBase), campo(t.totalKm), campo(t.ratePerKm), campo(t.taxPercent),
        campo(t.marginPercent), campo(t.tripValue), campo(t.ceiling), campo(t.ideal),
        campo(t.taxAmount),
        (t.driverName || '').replace(/;/g, ','), campo(t.finalAmount), campo(t.profit)
      ].join(';'));
    });
    var csv = '﻿' + linhas.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'taxista-viagens-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });

  // ================= TELA CONFIG =================
  function renderConfig() {
    settingsCache = Store.getSettings();
    document.getElementById('cfgTax').value = String(settingsCache.defaultTaxPercent).replace('.', ',');
    document.getElementById('cfgMargin').value = String(settingsCache.defaultMarginPercent).replace('.', ',');
    document.getElementById('cfgRate').value = settingsCache.defaultRatePerKm != null ? String(settingsCache.defaultRatePerKm).replace('.', ',') : '';
    renderListaMotoristas();
  }

  function renderListaMotoristas() {
    var lista = document.getElementById('listaMotoristas');
    if (!settingsCache.drivers || settingsCache.drivers.length === 0) {
      lista.innerHTML = '<div class="vazio" style="padding:12px">Nenhum motorista cadastrado.</div>';
      return;
    }
    lista.innerHTML = settingsCache.drivers.map(function (nome, i) {
      return '<div class="motorista-item"><span>' + escapeHtml(nome) + '</span>' +
        '<button data-idx="' + i + '" aria-label="Remover">🗑️</button></div>';
    }).join('');
    lista.querySelectorAll('button[data-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        settingsCache.drivers.splice(parseInt(btn.dataset.idx, 10), 1);
        Store.saveSettings(settingsCache);
        renderListaMotoristas();
      });
    });
  }

  function atualizarDatalistMotoristas() {
    var dl = document.getElementById('dataListMotoristas');
    dl.innerHTML = (settingsCache.drivers || []).map(function (n) { return '<option value="' + escapeHtml(n) + '">'; }).join('');
  }

  document.getElementById('btnAddMotorista').addEventListener('click', function () {
    var input = document.getElementById('inputNovoMotorista');
    var nome = input.value.trim();
    if (!nome) return;
    settingsCache = Store.getSettings();
    if (settingsCache.drivers.indexOf(nome) === -1) {
      settingsCache.drivers.push(nome);
      Store.saveSettings(settingsCache);
    }
    input.value = '';
    renderListaMotoristas();
    toast('Motorista adicionado.');
  });

  document.getElementById('btnSalvarConfig').addEventListener('click', function () {
    settingsCache = Store.getSettings();
    settingsCache.defaultTaxPercent = Calc.parseNumberBR(document.getElementById('cfgTax').value) || 10;
    settingsCache.defaultMarginPercent = Calc.parseNumberBR(document.getElementById('cfgMargin').value) || 10;
    var rateStr = document.getElementById('cfgRate').value.trim();
    settingsCache.defaultRatePerKm = rateStr === '' ? null : Calc.parseNumberBR(rateStr);
    Store.saveSettings(settingsCache);
    toast('Padrões salvos.');
  });

  // ---------- Backup ----------
  document.getElementById('btnExportarBackup').addEventListener('click', function () {
    var data = Store.exportBackup();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'taxista-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });

  document.getElementById('btnImportarBackup').addEventListener('click', function () {
    document.getElementById('inputImportarBackup').click();
  });

  document.getElementById('inputImportarBackup').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        Store.importBackup(data);
        settingsCache = Store.getSettings();
        renderConfig();
        toast('Backup importado com sucesso.');
      } catch (err) {
        toast('Arquivo de backup inválido.');
        console.error(err);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // ---------- Instalar (beforeinstallprompt) ----------
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('cardInstalar').style.display = 'block';
  });
  document.getElementById('btnInstalar').addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
  });
  window.addEventListener('appinstalled', function () {
    document.getElementById('cardInstalar').style.display = 'none';
  });

  // ================= SERVICE WORKER =================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var novo = reg.installing;
          if (!novo) return;
          novo.addEventListener('statechange', function () {
            if (novo.state === 'installed' && navigator.serviceWorker.controller) {
              toast('Nova versão disponível. Reabra o app para atualizar.');
            }
          });
        });
      }).catch(function (err) { console.error('Falha ao registrar service worker', err); });
    });
  }

  // ================= INICIALIZAÇÃO =================
  renderConfig();
  aplicarDefaults();
})();
