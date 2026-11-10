// Mod Manager: Visual panel and overlay manager for the Herdr app.
import * as fs from "fs/promises";
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, Scrollbar, InputState, Input } from "gpui-base";
import {
  run,
  theme,
  layout,
  panes,
  shared,
  appHome,
  readTextFile,
  props,
  closeOverlay,
} from "herdr";

const DEFAULT_FONT = "JetBrains Mono";
const I = (name) => `mods/mod-manager/${name}.svg`;

export default class ModManager extends View {
  init(_props, cx) {
    this.modList = null;
    this.modLoading = false;
    this.modError = null;
    this.modNotice = null;
    this.modFilter = "all";
    this.modQuery = "";
    this.modSearchInput = InputState.new({ placeholder: "Filter mods…" });
    this.modSearchInput.on("change", (_e, cx) => {
      this.modQuery = this.modSearchInput.value();
      cx.notify();
    });

    this.modCloneEdit = null;
    this.modCloneInput = InputState.new();
    this.modCloneFocused = false;
    this.modCloneInput.on("focus", (_e, cx) => {
      this.modCloneFocused = true;
      cx.notify();
    });
    this.modCloneInput.on("blur", (_e, cx) => {
      this.modCloneFocused = false;
      cx.notify();
    });
    this.modCloneInput.on("change", (_e, cx) => {
      if (this.modCloneEdit) this.modCloneEdit.as = this.modCloneInput.value();
      cx.notify();
    });

    this.handle = cx.focus_handle();
    this.handle.focus();

    cx.spawn(async (cx) => {
      await this.loadMods();
      cx.notify();
    });
  }

  close() {
    closeOverlay(props()?.overlay);
  }

  // --- Mod data loading ----------------------------------------------------

  async loadMods() {
    if (this.modLoading) return;
    this.modLoading = true;
    try {
      const root = appHome();
      const installedRaw = await readTextFile(`${root}/installed.json`);
      let installed = {};
      try {
        installed = installedRaw ? JSON.parse(installedRaw) : {};
      } catch {}
      const shippedSet = new Set(Object.keys(installed).filter((k) => !k.startsWith("layout:")));

      const entries = await fs.readdir(`${root}/mods`, { withFileTypes: true });
      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b));
      const list = [];
      const fallbackAbout = {
        changes: "Git working tree and staged changes viewer with inline unified diffs.",
        "new-menu": "The '+' menu on the tab bar: starts a terminal, installed coding agent, or git worktree.",
        tabs: "The workspace tab bar with pill tabs, agent status dots, and panel toggles.",
        "workspace-chrome": "Sidebar header (brand, search, collapse rail) and footer (Settings, Add machine).",
        "workspace-status": "Bottom status bar showing the current machine, active agents, and palette shortcut.",
      };

      for (const name of dirs) {
        let meta = {};
        try {
          const rawMeta = await readTextFile(`${root}/mods/${name}/mod.json`);
          if (rawMeta) meta = JSON.parse(rawMeta);
        } catch {}

        let about = "";
        try {
          const src = await readTextFile(`${root}/mods/${name}/main.js`);
          if (src) {
            const commentLines = [];
            for (const line of src.split(/\r?\n/)) {
              const trimmed = line.trim();
              if (trimmed.startsWith("//")) {
                const text = trimmed.replace(/^\/\/\s?/, "").trim();
                if (text) commentLines.push(text);
              } else if (trimmed === "" && commentLines.length === 0) {
                continue;
              } else {
                break;
              }
            }
            about = commentLines.slice(0, 2).join(" ");
          }
        } catch {}
        if (!about && fallbackAbout[name]) about = fallbackAbout[name];

        list.push({
          name,
          title: meta.title || null,
          place: meta.place || "none",
          size: meta.size || null,
          focusable: Boolean(meta.focusable),
          overlay: meta.overlay || null,
          clonedFrom: meta.cloned_from || null,
          shipped: shippedSet.has(name),
          disabled: false,
          about,
        });
      }

      const disabledDir = `${root}/mods-disabled`;
      let disabledDirs = [];
      try {
        const dEntries = await fs.readdir(disabledDir, { withFileTypes: true });
        disabledDirs = dEntries
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort((a, b) => a.localeCompare(b));
      } catch {}

      for (const name of disabledDirs) {
        let meta = {};
        try {
          const rawMeta = await readTextFile(`${disabledDir}/${name}/mod.json`);
          if (rawMeta) meta = JSON.parse(rawMeta);
        } catch {}

        let about = "";
        try {
          const src = await readTextFile(`${disabledDir}/${name}/main.js`);
          if (src) {
            const commentLines = [];
            for (const line of src.split(/\r?\n/)) {
              const trimmed = line.trim();
              if (trimmed.startsWith("//")) {
                const text = trimmed.replace(/^\/\/\s?/, "").trim();
                if (text) commentLines.push(text);
              } else if (trimmed === "" && commentLines.length === 0) {
                continue;
              } else {
                break;
              }
            }
            about = commentLines.slice(0, 2).join(" ");
          }
        } catch {}
        if (!about && fallbackAbout[name]) about = fallbackAbout[name];

        list.push({
          name,
          title: meta.title || null,
          place: meta.place || "none",
          size: meta.size || null,
          focusable: Boolean(meta.focusable),
          overlay: meta.overlay || null,
          clonedFrom: meta.cloned_from || null,
          shipped: false,
          disabled: true,
          about: about || "(Disabled mod in mods-disabled/)",
        });
      }

      this.modList = list;
      this.modError = null;
    } catch (e) {
      this.modError = String(e);
    } finally {
      this.modLoading = false;
    }
  }

  // --- Mod slot & layout inspection ----------------------------------------

  modUsageMap() {
    const usage = new Map();
    const add = (mod, label) => {
      if (!mod) return;
      if (!usage.has(mod)) usage.set(mod, new Set());
      usage.get(mod).add(label);
    };
    const tree = layout();
    const walk = (node, hiddenAncestor = false) => {
      if (!node || typeof node !== "object") return;
      const hidden = hiddenAncestor || Boolean(node.hidden);
      if (node.content?.mod) {
        add(node.content.mod, hidden ? "layout (hidden)" : "layout block");
      }
      if (node.content?.pane?.header?.content?.mod) {
        add(node.content.pane.header.content.mod, "pane header");
      }
      if (typeof node.header === "string" && node.header !== "tabs") {
        add(node.header, "stack header");
      } else if (node.header?.mod) {
        add(node.header.mod, "stack header");
      }
      for (const fl of node.floating ?? []) {
        if (fl?.content?.mod) add(fl.content.mod, `floating (${fl.edge ?? "edge"})`);
      }
      for (const ch of node.children ?? []) {
        const inactiveStack = node.type === "stack" && node.active && ch?.id && ch.id !== node.active;
        walk(ch, hidden || inactiveStack);
      }
    };
    walk(tree, false);
    if (tree && typeof tree === "object") {
      add(tree.terminal_menu || "menu", "terminal menu");
    }
    for (const p of panes() ?? []) {
      if (p.mod) add(p.mod, "open pane");
    }
    return usage;
  }

  resolveModSlot(modName, meta = {}) {
    if (["files", "pierre-tree-files", "file-icons"].includes(modName) || modName.endsWith("-files")) return "files";
    if (["changes", "git"].includes(modName) || modName.endsWith("-changes")) return "changes";
    if (["spaces", "spaces-tree"].includes(modName) || modName.endsWith("-spaces")) return "spaces";
    if (["workspace-chrome", "my-workspace-chrome"].includes(modName)) return "chrome";
    if (["workspace-status", "my-workspace-status"].includes(modName)) return "status";
    if (meta?.clonedFrom?.name) return this.resolveModSlot(meta.clonedFrom.name);
    return null;
  }

  getSlotDefaultMod(slot) {
    switch (slot) {
      case "files": return "files";
      case "changes": return "changes";
      case "spaces": return "spaces";
      case "chrome": return "workspace-chrome";
      case "status": return "workspace-status";
      default: return null;
    }
  }

  async toggleModInLayout(m, cx) {
    const layoutName = shared("layout") ?? "main";
    const shippedLayouts = new Set(["main", "terminals", "win98"]);
    if (shippedLayouts.has(layoutName)) {
      this.modNotice = `Layout "${layoutName}" is a read-only shipped layout. Duplicate it with "Duplicate layout" first.`;
      cx.notify();
      return;
    }

    const root = appHome();
    const layoutPath = `${root}/layouts/${layoutName}.json`;
    let tree = null;
    try {
      const raw = await readTextFile(layoutPath);
      if (raw) tree = JSON.parse(raw);
    } catch (e) {
      this.modNotice = `Failed to read layout file: ${e.message || e}`;
      cx.notify();
      return;
    }
    if (!tree) return;

    const usage = this.modUsageMap();
    const isActive = usage.has(m.name);
    const slot = this.resolveModSlot(m.name, m);
    let changed = false;

    if (isActive) {
      const defaultMod = slot ? this.getSlotDefaultMod(slot) : null;
      if (defaultMod && defaultMod !== m.name) {
        const replaceMod = (node) => {
          if (!node || typeof node !== "object") return;
          if (node.content?.mod === m.name) {
            node.content.mod = defaultMod;
            changed = true;
          }
          if (node.header?.mod === m.name) {
            node.header.mod = defaultMod;
            changed = true;
          }
          for (const fl of node.floating ?? []) {
            if (fl?.content?.mod === m.name) {
              fl.content.mod = defaultMod;
              changed = true;
            }
          }
          for (const ch of node.children ?? []) replaceMod(ch);
        };
        replaceMod(tree);
      } else {
        const hideOrRemove = (parent, node, idx) => {
          if (!node || typeof node !== "object") return;
          if (node.content?.mod === m.name) {
            node.hidden = true;
            changed = true;
          }
          for (const ch of node.children ?? []) hideOrRemove(node, ch, 0);
        };
        hideOrRemove(null, tree, 0);
      }
      this.modNotice = changed ? `Deactivated "${m.name}" in layout "${layoutName}".` : `Could not automatically deactivate "${m.name}".`;
    } else {
      if (slot) {
        const defaultMod = this.getSlotDefaultMod(slot);
        const swapMod = (node) => {
          if (!node || typeof node !== "object") return;
          if (node.content?.mod && (node.content.mod === defaultMod || this.resolveModSlot(node.content.mod) === slot)) {
            node.content.mod = m.name;
            if (node.hidden) delete node.hidden;
            changed = true;
          }
          if (node.header?.mod && (node.header.mod === defaultMod || this.resolveModSlot(node.header.mod) === slot)) {
            node.header.mod = m.name;
            changed = true;
          }
          for (const ch of node.children ?? []) swapMod(ch);
        };
        swapMod(tree);
      }
      this.modNotice = changed ? `Activated "${m.name}" in layout "${layoutName}".` : `Slot for "${m.name}" not found in layout "${layoutName}".`;
    }

    if (changed) {
      try {
        await fs.writeFile(layoutPath, JSON.stringify(tree, null, 2), "utf8");
      } catch (e) {
        this.modNotice = `Failed to save layout: ${e.message || e}`;
      }
      await this.loadMods();
      cx.notify();
    }
  }

  async toggleModPackage(m, disable, cx) {
    const root = appHome();
    const disabledDir = `${root}/mods-disabled`;
    try {
      await fs.mkdir(disabledDir, { recursive: true });
    } catch {}

    try {
      if (disable) {
        const usage = this.modUsageMap();
        if (usage.has(m.name)) {
          await this.toggleModInLayout(m, cx);
        }
        await fs.rename(`${root}/mods/${m.name}`, `${disabledDir}/${m.name}`);
        this.modNotice = `Disabled mod "${m.name}" (moved to mods-disabled/).`;
      } else {
        await fs.rename(`${disabledDir}/${m.name}`, `${root}/mods/${m.name}`);
        this.modNotice = `Enabled mod "${m.name}" (restored to mods/).`;
      }
    } catch (e) {
      this.modNotice = `Error toggling package "${m.name}": ${e.message || e}`;
    }
    await this.loadMods();
    cx.notify();
  }

  cloneMod(modName, asName, cx) {
    const target = (asName ?? "").trim() || `${modName}-copy`;
    this.modCloneEdit = null;
    this.handle.focus();
    run("mod.clone", { name: modName, as: target });
    this.modNotice = `Duplicated "${modName}" as "${target}" in mods/${target}.`;
    cx.spawn(async (cx) => {
      await this.loadMods();
      cx.notify();
    });
  }

  // --- UI Components -------------------------------------------------------

  toggle(t, id, on, onClick) {
    return div()
      .id(id)
      .w(36)
      .h(20)
      .rounded(10)
      .p(2)
      .cursor_pointer()
      .bg(on ? t.accent : t.input)
      .hover((s) => s.opacity(0.88))
      .on_click(onClick)
      .child(
        div()
          .w(16)
          .h(16)
          .rounded_full()
          .bg("#ffffff")
          .when(on, (el) => el.ml(16)),
      );
  }

  badge(t, text, kind = "neutral") {
    let bg = t.raised;
    let fg = t.muted;
    let border = t.border;
    if (kind === "accent") {
      bg = t.hover;
      fg = t.foreground;
      border = t.accent;
    } else if (kind === "custom") {
      bg = t.hover;
      fg = t.ansi2;
      border = t.border;
    }
    return div()
      .px(6)
      .py(1)
      .rounded(4)
      .border_1()
      .border_color(border)
      .bg(bg)
      .font_family(DEFAULT_FONT)
      .text_size(11)
      .text_color(fg)
      .child(text);
  }

  button(t, id, label, onClick) {
    return div()
      .id(id)
      .px(10)
      .py(4)
      .rounded(6)
      .border_1()
      .border_color(t.border)
      .bg(t.raised)
      .hover((st) => st.bg(t.hover).text_color(t.foreground))
      .cursor_pointer()
      .text_size(12.5)
      .text_color(t.muted)
      .on_click(onClick)
      .child(label);
  }

  modRow(t, m, roles) {
    const active = roles.length > 0;
    const edit = this.modCloneEdit?.mod === m.name ? this.modCloneEdit : null;
    const canOpenOverlay = Boolean(m.overlay) || ["help", "picker", "machine-add"].includes(m.name);
    const slot = this.resolveModSlot(m.name, m);
    const canToggleInLayout = !m.disabled && (active || Boolean(slot) || (m.place && m.place !== "none"));

    const badges = h_flex().gap(6).flex_wrap().items_center();
    if (m.title && m.title.toLowerCase() !== m.name.toLowerCase()) {
      badges.child(div().text_size(12.5).text_color(t.muted).child(`(${m.title})`));
    }
    if (m.disabled) {
      badges.child(this.badge(t, "Disabled", "neutral"));
    }
    badges.child(this.badge(t, m.shipped ? "Shipped" : "Custom", m.shipped ? "neutral" : "custom"));
    if (m.clonedFrom?.name) {
      badges.child(this.badge(t, `cloned from ${m.clonedFrom.name}`, "neutral"));
    }
    for (const r of roles) {
      badges.child(this.badge(t, r, "accent"));
    }
    if (m.overlay?.kind) {
      badges.child(this.badge(t, `overlay: ${m.overlay.kind}`, "neutral"));
    } else if (m.place && m.place !== "none") {
      badges.child(this.badge(t, `dock: ${m.place}`, "neutral"));
    }
    if (m.focusable) {
      badges.child(this.badge(t, "focusable", "neutral"));
    }

    const controls = h_flex().gap(8).items_center();
    const currentLayout = shared("layout") ?? "main";

    if (m.disabled) {
      controls.child(
        this.toggle(t, `st-mod-toggle-pkg-${m.name}`, false, (_e, cx) =>
          this.toggleModPackage(m, false, cx),
        ).tooltip("Mod is disabled. Click to enable."),
      );
    } else if (canToggleInLayout) {
      controls.child(
        this.toggle(t, `st-mod-toggle-${m.name}`, active, (_e, cx) =>
          this.toggleModInLayout(m, cx),
        ).tooltip(
          active
            ? `Active in "${currentLayout}". Click to deactivate.`
            : `Inactive in "${currentLayout}". Click to activate.`,
        ),
      );
    } else if (!m.shipped && !canOpenOverlay) {
      controls.child(
        this.toggle(t, `st-mod-toggle-pkg-${m.name}`, true, (_e, cx) =>
          this.toggleModPackage(m, true, cx),
        ).tooltip("Mod is enabled. Click to disable (move to mods-disabled/)."),
      );
    } else if (canOpenOverlay) {
      controls.child(
        this.button(t, `st-mod-open-${m.name}`, "Open", () => {
          this.close();
          run("mod.open", { name: m.name });
        }),
      );
    }

    const row = v_flex()
      .w_full()
      .py(12)
      .gap(6)
      .border_b(1)
      .border_color(t.border)
      .child(
        h_flex()
          .gap(10)
          .items_start()
          .child(
            div()
              .mt(6)
              .w(7)
              .h(7)
              .flex_none()
              .rounded(4)
              .bg(m.disabled ? t.dim : active ? t.accent : m.shipped ? t.dim : t.ansi2),
          )
          .child(
            v_flex()
              .flex_1()
              .min_w(0)
              .gap(4)
              .child(
                h_flex()
                  .gap(8)
                  .flex_wrap()
                  .items_center()
                  .child(
                    div()
                      .font_family(DEFAULT_FONT)
                      .text_size(13.5)
                      .font_semibold()
                      .text_color(t.foreground)
                      .child(m.name),
                  )
                  .child(badges),
              )
              .when(Boolean(m.about), (el) =>
                el.child(div().text_size(12.5).line_height("18px").text_color(t.dim).child(m.about)),
              )
              .child(
                div()
                  .font_family(DEFAULT_FONT)
                  .text_size(11.5)
                  .text_color(t.muted)
                  .child(`mods/${m.name}/main.js`),
              ),
          )
          .child(controls.flex_none()),
      );

    if (edit) {
      const cancel = this.button(t, `st-mod-cancel-${m.name}`, "Cancel", (_e, cx) => {
        this.modCloneEdit = null;
        this.handle.focus();
        cx.notify();
      });
      row.child(
        v_flex()
          .pl(17)
          .pt(4)
          .gap(6)
          .child(div().text_size(12).text_color(t.dim).child(`Duplicate "${m.name}" to a new custom mod folder in mods/:`))
          .child(
            h_flex()
              .gap(6)
              .items_center()
              .child(
                Input.new(this.modCloneInput)
                  .flex_1()
                  .min_w(0)
                  .h(32)
                  .px(10)
                  .rounded(7)
                  .border_1()
                  .border_color(this.modCloneFocused ? t.accent : t.input)
                  .bg(t.background)
                  .text_size(13)
                  .text_color(t.foreground),
              )
              .child(cancel)
              .child(
                this.button(t, `st-mod-save-${m.name}`, "Create copy", (_e, cx) =>
                  this.cloneMod(m.name, edit.as, cx),
                ),
              ),
          ),
      );
    }

    return row;
  }

  // --- Main View Render -----------------------------------------------------

  render(cx) {
    const t = theme();
    const list = this.modList ?? [];
    const usage = this.modUsageMap();
    const currentLayout = shared("layout") ?? "main";
    const q = this.modQuery.trim().toLowerCase();

    const activeCount = list.filter((m) => !m.disabled && usage.has(m.name)).length;
    const customCount = list.filter((m) => !m.shipped && !m.disabled).length;
    const disabledCount = list.filter((m) => m.disabled).length;
    const shippedCount = list.filter((m) => m.shipped).length;

    const filtered = list
      .filter((m) => {
        if (this.modFilter === "active" && (!usage.has(m.name) || m.disabled)) return false;
        if (this.modFilter === "custom" && (m.shipped || m.disabled)) return false;
        if (this.modFilter === "disabled" && !m.disabled) return false;
        if (this.modFilter === "shipped" && !m.shipped) return false;
        if (!q) return true;
        const roles = [...(usage.get(m.name) ?? [])].join(" ");
        const hay = `${m.name} ${m.title ?? ""} ${m.about ?? ""} ${roles} ${m.disabled ? "disabled" : ""} ${m.shipped ? "shipped" : "custom"}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (Boolean(a.disabled) !== Boolean(b.disabled)) return a.disabled ? 1 : -1;
        const aActive = usage.has(a.name) ? 0 : 1;
        const bActive = usage.has(b.name) ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        if (a.shipped !== b.shipped) return a.shipped ? 1 : -1;
        return a.name.localeCompare(b.name);
      });

    const filterTabs = [
      ["all", `All (${list.length})`],
      ["active", `In ${currentLayout} (${activeCount})`],
      ["custom", `Custom (${customCount})`],
      ...(disabledCount > 0 ? [["disabled", `Disabled (${disabledCount})`]] : []),
      ["shipped", `Shipped (${shippedCount})`],
    ];

    return v_flex()
      .id("mod-manager-window")
      .track_focus(this.handle)
      .size_full()
      .min_h(0)
      .rounded(10)
      .border_1()
      .border_color(t.border)
      .bg(t.background)
      .overflow_hidden()
      .on_key_down((e, cx) => {
        if (e.key === "escape") {
          if (this.modCloneEdit) {
            this.modCloneEdit = null;
            this.handle.focus();
          } else {
            this.close();
          }
          cx.stop_propagation();
          cx.notify();
        }
      })
      .child(
        // Window Title Bar
        h_flex()
          .h(42)
          .px(16)
          .items_center()
          .justify_between()
          .border_b(1)
          .border_color(t.border)
          .bg(t.chrome)
          .child(
            h_flex()
              .gap(8)
              .items_center()
              .child(svg(I("layers")).size(16).text_color(t.accent))
              .child(div().font_semibold().text_size(14).text_color(t.foreground).child("Mod Manager")),
          )
          .child(
            div()
              .id("mod-manager-close")
              .size(24)
              .rounded(5)
              .cursor_pointer()
              .flex()
              .items_center()
              .justify_center()
              .text_color(t.muted)
              .hover((s) => s.bg(t.hover).text_color(t.foreground))
              .tooltip("Close (Esc)")
              .on_click(() => this.close())
              .child(div().text_size(16).child("×")),
          ),
      )
      .child(
        // Content Area with Scrollbar
        div()
          .relative()
          .flex_1()
          .min_w(0)
          .min_h(0)
          .child(
            div()
              .id("st-mods-body")
              .size_full()
              .overflow_y_scroll()
              .child(
                v_flex()
                  .w_full()
                  .px(24)
                  .py(18)
                  // Header info & Refresh
                  .child(
                    h_flex()
                      .w_full()
                      .items_center()
                      .justify_between()
                      .child(div().text_size(16).font_semibold().text_color(t.foreground).child("Installed Mods"))
                      .child(
                        div()
                          .id("st-mod-refresh")
                          .size(28)
                          .rounded(6)
                          .cursor_pointer()
                          .flex()
                          .items_center()
                          .justify_center()
                          .text_color(t.muted)
                          .hover((s) => s.bg(t.hover).text_color(t.foreground))
                          .tooltip("Refresh installed mods")
                          .on_click((_e, cx) => {
                            cx.spawn(async (cx) => {
                              await this.loadMods();
                              cx.notify();
                            });
                          })
                          .child(
                            svg(I("refresh"))
                              .size(14)
                              .when(Boolean(this.modLoading), (el) => el.spin(900)),
                          ),
                      ),
                  )
                  .child(
                    div()
                      .pt(4)
                      .pb(12)
                      .text_size(12.5)
                      .line_height("18px")
                      .text_color(t.dim)
                      .child(
                        `Panels, menus, headers and overlays in mods/. Mods highlighted with a blue dot are active in the "${currentLayout}" layout. Shipped mods are read-only—duplicate one to customize its code.`,
                      ),
                  )
                  // Notice Banner
                  .when(Boolean(this.modNotice), (el) =>
                    el.child(
                      h_flex()
                        .mb(10)
                        .px(12)
                        .py(8)
                        .rounded(7)
                        .border_1()
                        .border_color(t.border)
                        .bg(t.raised)
                        .items_center()
                        .justify_between()
                        .child(div().text_size(12.5).text_color(t.ansi2).child(this.modNotice))
                        .child(
                          div()
                            .id("st-mod-notice-close")
                            .cursor_pointer()
                            .text_size(12)
                            .text_color(t.muted)
                            .hover((s) => s.text_color(t.foreground))
                            .on_click((_e, cx) => {
                              this.modNotice = null;
                              cx.notify();
                            })
                            .child("Dismiss"),
                        ),
                    ),
                  )
                  // Search & Filter Tabs
                  .child(
                    h_flex()
                      .w_full()
                      .pb(10)
                      .gap(8)
                      .flex_wrap()
                      .items_center()
                      .child(
                        h_flex()
                          .p(2)
                          .gap(2)
                          .rounded(8)
                          .border_1()
                          .border_color(t.border)
                          .bg(t.background)
                          .children(
                            filterTabs.map(([id, label]) => {
                              const on = this.modFilter === id;
                              return div()
                                .id(`st-mf-${id}`)
                                .px(10)
                                .py(4)
                                .rounded(6)
                                .text_size(12.5)
                                .cursor_pointer()
                                .when(on, (el) =>
                                  el.bg(t.raised).text_color(t.foreground).border_1().border_color(t.border),
                                )
                                .when(!on, (el) =>
                                  el.text_color(t.muted).hover((s) => s.text_color(t.foreground)),
                                )
                                .on_click((_e, cx) => {
                                  this.modFilter = id;
                                  cx.notify();
                                })
                                .child(label);
                            }),
                          ),
                      )
                      .child(
                        div()
                          .flex_1()
                          .min_w(180)
                          .px(10)
                          .py(3)
                          .rounded(8)
                          .border_1()
                          .border_color(t.border)
                          .bg(t.background)
                          .text_size(12.5)
                          .child(Input.new(this.modSearchInput).h(24).text_color(t.foreground)),
                      ),
                  )
                  // Loading Indicator
                  .when(this.modList === null && !this.modError, (el) =>
                    el.child(
                      h_flex()
                        .py(14)
                        .gap(8)
                        .items_center()
                        .child(svg(I("refresh")).size(14).text_color(t.accent).spin(900))
                        .child(div().text_size(12.5).text_color(t.dim).child("Reading mods…")),
                    ),
                  )
                  // Error notice
                  .when(Boolean(this.modError), (el) =>
                    el.child(div().py(10).text_size(12.5).text_color(t.blocked).child(this.modError)),
                  )
                  // Mod List Rows
                  .children(filtered.map((m) => this.modRow(t, m, [...(usage.get(m.name) ?? [])])))
                  .when(this.modList !== null && filtered.length === 0, (el) =>
                    el.child(div().py(18).text_size(13).text_color(t.dim).child("No mods match the current filter.")),
                  ),
              ),
          )
          .child(Scrollbar.vertical("st-mods-body").mode("always").absolute().inset_0()),
      );
  }
}
