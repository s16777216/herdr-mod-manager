// Standalone sidebar button for opening Mod Manager.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, run, layout, window } from "herdr";

function narrow() {
  const find = (n, id) => {
    if (n?.id === id) return n;
    for (const c of n?.children ?? []) {
      const hit = find(c, id);
      if (hit) return hit;
    }
    return null;
  };
  const width = find(layout(), "sidebar")?.size?.px;
  return width ? width < (window()?.platform === "macos" ? 90 : 60) : false;
}

export default class ModsNavBtn extends View {
  render() {
    const t = theme();
    const collapsed = narrow();

    const row = h_flex()
      .id("btn-open-mods")
      .h(28)
      .w_full()
      .px(8)
      .gap(9)
      .items_center()
      .rounded(8)
      .when(collapsed, (el) => el.relative().w(32).px(0).justify_center().tooltip("Mods"))
      .text_color(t.muted)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .cursor_pointer()
      .on_click(() => run("mod.open", { name: "mod-manager" }))
      .child(svg("mods/mods-nav-btn/layers.svg").size(14))
      .when(!collapsed, (el) => el.child("Mods"));

    return v_flex()
      .size_full()
      .bg(t.chrome)
      .px(8)
      .pt(4)
      .pb(2)
      .text_size(13)
      .when(collapsed, (el) => el.px(0).items_center())
      .child(row);
  }
}
