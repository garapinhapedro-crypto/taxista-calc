/**
 * Núcleo de cálculo — funções puras, sem efeitos colaterais.
 * Isolado de propósito: reutilizável pelos testes e por qualquer
 * fonte futura de preenchimento do km (o km total continua sendo a
 * fonte única de verdade).
 */
(function (global) {
  'use strict';

  /**
   * Converte entrada do usuário (string com vírgula ou ponto, vazia,
   * negativa ou inválida) em um número finito >= 0.
   */
  function parseNumberBR(value) {
    if (typeof value === 'number') {
      return isFinite(value) && value > 0 ? value : 0;
    }
    if (value == null) return 0;
    var s = String(value).trim();
    if (s === '') return 0;
    // Aceita "1.234,56" (BR) e "1234.56" (US). Remove milhar e troca vírgula decimal por ponto.
    s = s.replace(/\s/g, '');
    var hasComma = s.indexOf(',') !== -1;
    var hasDot = s.indexOf('.') !== -1;
    if (hasComma && hasDot) {
      // formato BR com milhar: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      s = s.replace(',', '.');
    }
    var n = parseFloat(s);
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }

  /**
   * Calcula os valores da viagem.
   * @param {Object} input
   *  totalKm: number (km total rodado)
   *  ratePerKm: number (R$/km pago pela seguradora)
   *  taxPercent: number (%)
   *  marginPercent: number (%)
   *  driverOffer: number|null (R$ oferecido ao taxista, opcional)
   *  horaParada: number (R$ de hora parada, já calculado pelo usuário, opcional)
   * @returns {Object} resultado completo do cálculo
   */
  function calcularViagem(input) {
    var totalKm = Math.max(0, Number(input.totalKm) || 0);
    var ratePerKm = Math.max(0, Number(input.ratePerKm) || 0);
    var taxPercent = Math.max(0, Number(input.taxPercent) || 0);
    var marginPercent = Math.max(0, Number(input.marginPercent) || 0);
    var driverOffer = input.driverOffer == null ? null : Math.max(0, Number(input.driverOffer) || 0);
    var horaParada = Math.max(0, Number(input.horaParada) || 0);

    // Hora parada entra na mesma "massa" que vira teto/ideal/imposto/lucro.
    var tripValue = (totalKm * ratePerKm) + horaParada;
    var ceiling = tripValue * (1 - taxPercent / 100);
    var ideal = tripValue * (1 - taxPercent / 100 - marginPercent / 100);

    function perKm(total) {
      return totalKm > 0 ? total / totalKm : 0;
    }

    var result = {
      totalKm: safe(totalKm),
      horaParada: safe(horaParada),
      tripValue: safe(tripValue),
      tripValuePerKm: safe(perKm(tripValue)),
      ceiling: safe(ceiling),
      ceilingPerKm: safe(perKm(ceiling)),
      ideal: safe(ideal),
      idealPerKm: safe(perKm(ideal)),
      taxAmount: safe(tripValue * (taxPercent / 100)),
      taxAmountPerKm: safe(perKm(tripValue * (taxPercent / 100))),
      marginAmount: safe(tripValue * (marginPercent / 100)),
      marginAmountPerKm: safe(perKm(tripValue * (marginPercent / 100))),
      status: null,
      profit: null,
      profitPerKm: null,
      offerPerKm: null,
      lossAmount: null
    };

    if (driverOffer != null && driverOffer > 0) {
      var taxAmount = tripValue * (taxPercent / 100);
      var profit = tripValue - taxAmount - driverOffer;
      result.offerPerKm = safe(perKm(driverOffer));
      result.profit = safe(profit);
      result.profitPerKm = safe(perKm(profit));

      if (driverOffer <= ideal + 1e-9) {
        result.status = 'verde';
      } else if (driverOffer <= ceiling + 1e-9) {
        result.status = 'amarelo';
      } else {
        result.status = 'vermelho';
        result.lossAmount = safe(driverOffer - ceiling);
      }
    }

    return result;
  }

  function safe(n) {
    if (!isFinite(n) || isNaN(n)) return 0;
    // Evita -0
    return n === 0 ? 0 : n;
  }

  /** Formata número como moeda BR: R$ 1.234,56 */
  function formatBRL(value) {
    var n = safe(Number(value));
    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /** Formata número como km: 123,4 km */
  function formatKm(value) {
    var n = safe(Number(value));
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  }

  /** Formata R$/km: R$ 1,85/km */
  function formatPerKm(value) {
    var n = safe(Number(value));
    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '/km';
  }

  var TaxistaCalc = {
    parseNumberBR: parseNumberBR,
    calcularViagem: calcularViagem,
    formatBRL: formatBRL,
    formatKm: formatKm,
    formatPerKm: formatPerKm
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxistaCalc;
  } else {
    global.TaxistaCalc = TaxistaCalc;
  }
})(typeof window !== 'undefined' ? window : this);
