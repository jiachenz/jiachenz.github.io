(function () {
  "use strict";

  var STORAGE_KEY = "void_fragments_v1";
  var MAX_STORED = 24;

  function normalizeEntry(item) {
    if (item == null) return null;
    if (typeof item === "string") {
      var s = item.trim();
      return s ? { text: s, weight: 1 } : null;
    }
    if (typeof item === "object" && typeof item.text === "string") {
      var t = item.text.trim();
      if (!t) return null;
      var w = Number(item.weight);
      if (!isFinite(w) || w <= 0) w = 1;
      return { text: t, weight: w };
    }
    return null;
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      var out = [];
      for (var i = 0; i < parsed.length; i++) {
        var e = normalizeEntry(parsed[i]);
        if (e) out.push(e);
      }
      return out;
    } catch (err) {
      return [];
    }
  }

  function saveToStorage(entries) {
    try {
      var slim = entries.slice(-MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (err) {
      /* quota or private mode */
    }
  }

  function dedupeByText(entries) {
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < entries.length; i++) {
      var t = entries[i].text;
      if (seen[t]) continue;
      seen[t] = true;
      out.push(entries[i]);
    }
    return out;
  }

  function weightedPick(entries, rng) {
    if (!entries.length) return "";
    var total = 0;
    for (var i = 0; i < entries.length; i++) total += entries[i].weight;
    var r = (rng || Math.random)() * total;
    for (var j = 0; j < entries.length; j++) {
      r -= entries[j].weight;
      if (r <= 0) return entries[j].text;
    }
    return entries[entries.length - 1].text;
  }

  window.VoidFragments = {
    STORAGE_KEY: STORAGE_KEY,

    loadRemote: function () {
      return fetch("data/fragments.json", { credentials: "same-origin" })
        .then(function (res) {
          if (!res.ok) throw new Error("fragments.json " + res.status);
          return res.json();
        })
        .then(function (data) {
          var list = Array.isArray(data) ? data : [];
          var out = [];
          for (var i = 0; i < list.length; i++) {
            var e = normalizeEntry(list[i]);
            if (e) out.push(e);
          }
          return dedupeByText(out);
        });
    },

    merge: function (remoteEntries) {
      var local = loadFromStorage();
      var merged = dedupeByText(remoteEntries.concat(local));
      return merged;
    },

    rememberLocal: function (text) {
      var t = String(text || "").trim();
      if (!t) return;
      var stored = loadFromStorage();
      stored.push({ text: t, weight: 1 });
      saveToStorage(dedupeByText(stored));
    },

    randomText: function (entries, rng) {
      return weightedPick(entries, rng);
    },
  };
})();
