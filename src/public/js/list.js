// 一覧。手がかりの多い順。検索、山の絞り込み、待ったの物だけ。
import { recordOn, refreshTerms } from "./mask.js";
import * as up from "./uploader.js";
import {
  LEVEL_NAMES,
  PILE_NAMES,
  SOURCE_NAMES,
  api,
  errorText,
  h,
  itemTitle,
  poll,
  thumbImg,
} from "./util.js";

const POLL_MS = 3000;
// 詳細から戻っても、探していた続きから見られるよう、片付けごとに覚える。開いている間だけ
const remembered = new Map(); // pid → { pile, waited, q, y }

function statusLine(item) {
  if (item.status === "failed") return "読めませんでした。写真は残っています";
  if (item.stale) return "読み取りが止まっています。開くと、もう一度読めます";
  if (item.status !== "done") return "読み取り中";
  return item.confidence ? `読み取り：${LEVEL_NAMES[item.confidence]}` : null;
}

function cardEl(pid, item, matched) {
  const title = itemTitle(item);
  return h(
    "a",
    {
      class: `card${item.wait_count ? " waited" : ""}`,
      href: `#/p/${pid}/item/${item.id}`,
      "data-item": item.id,
      "data-status": item.status,
    },
    thumbImg(item, "thumb"),
    h(
      "div",
      {},
      h("h2", item.title && item.kind !== item.title ? { "data-rec": item.kind ?? "hide" } : {}, title),
      h(
        "p",
        { class: "sub" },
        // 1 人でも待ったをかけた物は残す。「残す」は保存せず、待ったの有無で決まる
        item.wait_count
          ? [
              h("span", { class: "pile-tag kept" }, "残す"),
              h("span", { class: "pile-tag" }, `（置いた山：${PILE_NAMES[item.pile]}）`),
            ]
          : h("span", { class: `pile-tag ${item.pile}` }, PILE_NAMES[item.pile]),
        item.kind && item.kind !== title ? `　${item.kind}` : "",
      ),
      statusLine(item) ? h("p", { class: "sub item-status" }, statusLine(item)) : null,
      item.chips.length || item.needs_retake
        ? h(
            "div",
            { class: "chips" },
            item.chips.map((c) => h("span", { class: "chip" }, c)),
            item.needs_retake && !item.chips.includes("撮り直し候補")
              ? h("span", { class: "chip retake" }, "撮り直し候補")
              : null,
          )
        : null,
      item.rank_reason?.includes("字を上に向けて")
        ? h("p", { class: "sub reason-line retake-hint" }, "字を上に向けて撮り直してください")
        : null,
      matched?.map((m) =>
        h(
          "span",
          { class: `match ${m.source}` },
          h("b", {}, SOURCE_NAMES[m.source]),
          "：",
          h("span", { "data-rec": "hide" }, m.term),
        ),
      ),
      item.wait_count
        ? h("span", { class: "wait-mark" }, `待った ${item.wait_count}`)
        : null,
    ),
  );
}

export function listView({ pid, project }, root) {
  const saved = remembered.get(pid);
  const state = { pile: saved?.pile ?? "all", waited: saved?.waited ?? false, q: saved?.q ?? "" };
  let restoreY = saved?.y ?? 0;
  const cards = h("div", { class: "cards", id: "cards" });
  const pendingBox = h("div", {});
  const filterBox = h("div", { class: "filters" });
  const countLine = h("p", { class: "note", id: "count" });
  const dropNote = h("p", { class: "note", id: "drop-note", hidden: true });
  const rendered = new Map(); // id → { json, el }
  let latest = [];
  let seq = 0;

  // 「いらない」には待ったの物を入れない。捨てる物の一覧に、残す物を混ぜないため。
  // 「待ったの物だけ」を重ねたときは、いらない山の待ったの物を探しているので出す
  const inPile = (item, p) =>
    p === "all" || (item.pile === p && !(p === "drop" && item.wait_count > 0 && !state.waited));

  function renderFilters() {
    const count = (p) => latest.filter(({ item }) => inPile(item, p)).length;
    const chip = (key, name) =>
      h(
        "button",
        {
          class: "filter",
          id: `filter-${key}`,
          "aria-pressed": String(state.pile === key),
          onclick: () => {
            state.pile = key;
            render();
          },
        },
        `${name} ${count(key)}`,
      );
    filterBox.replaceChildren(
      chip("all", "すべて"),
      ...Object.entries(PILE_NAMES).map(([k, v]) => chip(k, v)),
      h(
        "button",
        {
          class: "filter wait",
          id: "filter-waited",
          "aria-pressed": String(state.waited),
          onclick: () => {
            state.waited = !state.waited;
            render();
          },
        },
        "待ったの物だけ",
      ),
    );
  }

  function render() {
    renderFilters();
    const shown = latest.filter(
      ({ item }) => inPile(item, state.pile) && (!state.waited || item.wait_count > 0),
    );
    const held = latest.filter(({ item }) => item.pile === "drop" && item.wait_count > 0).length;
    dropNote.hidden = !(state.pile === "drop" && held > 0 && !state.waited);
    dropNote.textContent = `待ったの付いた物 ${held} 件は残すので、ここには出しません。`;
    const next = [];
    const keep = new Map();
    for (const { item, matched } of shown) {
      const { updated_at: _skip, ...stable } = item;
      const json = JSON.stringify([stable, matched]);
      const old = rendered.get(item.id);
      const el = old?.json === json ? old.el : cardEl(pid, item, matched);
      keep.set(item.id, { json, el });
      next.push(el);
    }
    rendered.clear();
    for (const [k, v] of keep) rendered.set(k, v);
    if (next.length) {
      // 変わった所だけを差し替える。並びが同じならスクロールも写真も動かない
      next.forEach((el, i) => {
        if (cards.children[i] !== el) cards.insertBefore(el, cards.children[i] ?? null);
      });
      while (cards.children.length > next.length) cards.lastChild.remove();
    } else {
      cards.replaceChildren(
        h(
          "div",
          { class: "empty" },
          h(
            "p",
            {},
            state.q
              ? "見つかりませんでした。別の言葉で探してください。"
              : latest.length
                ? "この絞り込みに当てはまる物はありません。"
                : "まだ物がありません。「撮る」から始めてください。",
          ),
        ),
      );
    }
    const narrowed = state.pile !== "all" || state.waited;
    countLine.textContent = state.q
      ? `「${recordOn() ? "■■" : state.q}」で ${shown.length} 件`
      : narrowed
        ? `${shown.length} 件を表示（全 ${latest.length} 件）`
        : `全 ${latest.length} 件`;
  }

  function renderPending() {
    const waiting = up.list(pid).filter((e) => e.state !== "sent");
    const held = waiting.filter((e) => e.state === "hold");
    const rest = waiting.filter((e) => e.state !== "hold");
    const stuck = rest.filter((e) => e.state === "rejected" && !up.canResend(e));
    pendingBox.replaceChildren(
      ...(waiting.length
        ? [
            h(
              "div",
              { class: "pending-box", id: "pending" },
              held.length
                ? [
                    h("p", { id: "pending-hold" }, `もうすぐ送る写真が ${held.length} 枚あります。今なら取り消せます。`),
                    h(
                      "button",
                      {
                        class: "btn small",
                        id: "pending-undo",
                        onclick: () => held.forEach((e) => up.undo(e.cid)),
                      },
                      "取り消す",
                    ),
                  ]
                : null,
              rest.length
                ? h("p", {}, `まだ送っていない写真が ${rest.length} 枚あります。写真は端末に残っています。`)
                : null,
              rest.flatMap((e) => (e.state === "rejected" && errorText(e.error) ? [errorText(e.error)] : []))
                .filter((t, i, all) => all.indexOf(t) === i)
                .map((t) => h("p", { class: "note fixed-note" }, t)),
              rest.some((e) => e.state === "rejected" && up.canResend(e))
                ? h("button", { class: "btn small", onclick: () => up.retryNow() }, "もう一度送る")
                : null,
              stuck.length
                ? [
                    h(
                      "button",
                      { class: "btn small", id: "pending-discard", onclick: () => stuck.forEach((e) => up.discard(e.cid)) },
                      "この写真を外す",
                    ),
                    project.is_sample
                      ? h("a", { class: "btn small", id: "to-own", href: "#/" }, "自分の片付けで試す")
                      : null,
                  ]
                : null,
            ),
          ]
        : []),
    );
  }

  async function load() {
    const mine = ++seq;
    await refreshTerms(pid);
    const data = state.q
      ? (await api(`/api/p/${pid}/search?q=${encodeURIComponent(state.q)}`)).hits
      : (await api(`/api/p/${pid}/items`)).items.map((item) => ({ item }));
    if (mine !== seq) return;
    latest = data;
    render();
    // 詳細から戻ったときは、最初の読み込みの後で元の位置へ戻す
    if (restoreY) {
      window.scrollTo(0, restoreY);
      restoreY = 0;
    }
  }

  let debounce = null;
  const search = h("input", {
    id: "search",
    type: "search",
    placeholder: "物の名前、文字、見立てで探す",
    "aria-label": "探す",
    autocomplete: "off",
    value: state.q,
    oninput: () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.q = search.value.trim();
        rendered.clear();
        cards.replaceChildren();
        load();
      }, 300);
    },
  });

  root.replaceChildren(
    h(
      "div",
      { class: "page" },
      h(
        "div",
        { class: "list-head" },
        h("a", { class: "back", id: "to-entry", href: "#/" }, "片付けの切り替え"),
        h("h1", {}, project.title),
        project.is_sample
          ? h("p", { class: "note fixed-note" }, "見本です。名前も物も架空です。24 時間を過ぎると消えます。")
          : null,
        h("p", { class: "note order-note", id: "order-note" }, "手がかりの多い順です。大切さの順ではありません。"),
      ),
      h("div", { class: "search" }, search),
      filterBox,
      dropNote,
      pendingBox,
      cards,
      countLine,
    ),
  );
  renderPending();
  load();
  const unsubscribe = up.onChange(() => {
    renderPending();
    load();
  });
  const stop = poll(load, POLL_MS);
  return () => {
    remembered.set(pid, { pile: state.pile, waited: state.waited, q: state.q, y: window.scrollY });
    stop();
    unsubscribe();
    clearTimeout(debounce);
  };
}
