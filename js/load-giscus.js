/**
 * 在 https://giscus.app/zh-CN 选择仓库与 Discussion 分类后，
 * 将生成的 repo id、category id 填入 ../data/giscus.json。
 * 仓库需开启 Discussions，并安装 Giscus GitHub App。
 */
(async function () {
  var root = document.getElementById("giscus-root");
  if (!root) return;

  var cfg;
  try {
    var res = await fetch("data/giscus.json", { credentials: "same-origin" });
    if (!res.ok) throw new Error(String(res.status));
    cfg = await res.json();
  } catch (e) {
    root.innerHTML =
      '<p class="muted giscus-fallback">无法加载 giscus 配置（<code>data/giscus.json</code>）。</p>';
    return;
  }

  var rid = String(cfg.repoId || "").trim();
  var cid = String(cfg.categoryId || "").trim();
  if (!rid || !cid) {
    root.innerHTML =
      '<p class="muted giscus-fallback">请打开 <a href="https://giscus.app/zh-CN">giscus.app</a>，选择本仓库与 Discussion 分类（如 Guestbook），把得到的 <strong>data-repo-id</strong>、<strong>data-category-id</strong> 写入仓库里的 <code>data/giscus.json</code>，推送后刷新本页。</p>';
    return;
  }

  root.classList.add("giscus");
  root.innerHTML = "";

  var s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  s.setAttribute("data-repo", cfg.repo);
  s.setAttribute("data-repo-id", rid);
  s.setAttribute("data-category", cfg.category || "General");
  s.setAttribute("data-category-id", cid);
  s.setAttribute("data-mapping", cfg.mapping || "pathname");
  s.setAttribute("data-strict", cfg.strict != null ? String(cfg.strict) : "0");
  s.setAttribute(
    "data-reactions-enabled",
    cfg.reactionsEnabled != null ? String(cfg.reactionsEnabled) : "1"
  );
  s.setAttribute(
    "data-emit-metadata",
    cfg.emitMetadata != null ? String(cfg.emitMetadata) : "0"
  );
  s.setAttribute(
    "data-input-position",
    cfg.inputPosition || "bottom"
  );
  s.setAttribute("data-theme", cfg.theme || "noborder_dark");
  s.setAttribute("data-lang", cfg.lang || "zh-CN");
  if (cfg.loading) s.setAttribute("data-loading", cfg.loading);

  var parent = root.parentNode;
  if (parent) {
    parent.insertBefore(s, root.nextSibling);
  } else {
    document.body.appendChild(s);
  }
})();
